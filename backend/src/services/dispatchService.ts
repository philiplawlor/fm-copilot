import { executeQuery, executeUpdate } from '../config/database';
import { logger } from '../utils/logger';

interface DispatchRecommendationParams {
  work_order_id: number;
  organization_id: number;
}

interface TechnicianAssignment {
  technician_id: number;
  confidence_score: number;
  factors: {
    skills_match: number;
    location_proximity: number;
    workload: number;
    availability: number;
    past_performance: number;
  };
  reasoning: string;
}

interface VendorAssignment {
  vendor_id: number;
  confidence_score: number;
  factors: {
    specialty_match: number;
    cost_rating: number;
    response_time: number;
    reliability: number;
  };
  reasoning: string;
  estimated_cost: number;
  estimated_response_time_hours: number;
}

interface DispatchResult {
  work_order_id: number;
  recommendations: {
    technicians: TechnicianAssignment[];
    vendors: VendorAssignment[];
  };
  recommended_assignment: {
    type: 'technician' | 'vendor';
    id: number;
    confidence_score: number;
    reasoning: string;
  };
}

export class DispatchService {
  async getRecommendations(params: DispatchRecommendationParams): Promise<DispatchResult> {
    const { work_order_id, organization_id } = params;

    try {
      // Get work order details with asset info
      const workOrder = await this.getWorkOrderDetails(work_order_id, organization_id);
      if (!workOrder) {
        throw new Error('Work order not found');
      }

      // Get available technicians
      const technicians = await this.evaluateTechnicians(work_order_id, organization_id, workOrder);

      // Get relevant vendors
      const vendors = await this.evaluateVendors(work_order_id, organization_id, workOrder);

      // Determine best assignment
      const recommended = this.determineBestAssignment(technicians, vendors, workOrder);

      return {
        work_order_id,
        recommendations: {
          technicians,
          vendors
        },
        recommended_assignment: recommended
      };
    } catch (error) {
      logger.error('Error getting dispatch recommendations:', error);
      throw error;
    }
  }

  private async getWorkOrderDetails(workOrderId: number, organizationId: number) {
    const query = `
      SELECT wo.*, 
             a.asset_category_id, ac.name as category_name,
             a.location_description as asset_location,
             s.name as site_name, s.address as site_address,
             u.first_name, u.last_name as requester_name
      FROM work_orders wo
      LEFT JOIN assets a ON wo.asset_id = a.id
      LEFT JOIN asset_categories ac ON a.asset_category_id = ac.id
      LEFT JOIN sites s ON wo.site_id = s.id
      LEFT JOIN users u ON wo.requested_by_user_id = u.id
      WHERE wo.id = ? AND wo.organization_id = ?
    `;

    return await executeQuery(query, [workOrderId, organizationId]).then(results => results[0]);
  }

  private async evaluateTechnicians(
    workOrderId: number, 
    organizationId: number, 
    workOrder: any
  ): Promise<TechnicianAssignment[]> {
    // Get technicians with their skills and current workload
    const query = `
      SELECT t.*, u.first_name, u.last_name, u.email,
             (SELECT COUNT(*) FROM work_orders wo2 
              WHERE wo2.assigned_technician_id = t.id 
              AND wo2.status IN ('assigned', 'in_progress')) as current_workload
      FROM technicians t
      JOIN users u ON t.user_id = u.id
      WHERE t.organization_id = ? AND t.is_available = TRUE
      ORDER BY current_workload ASC
    `;

    const technicians = await executeQuery(query, [organizationId]);

    // Evaluate each technician
    const evaluations = await Promise.all(
      technicians.map(async (tech: any) => {
        const skillsMatch = await this.calculateSkillsMatch(tech, workOrder);
        const locationProximity = this.calculateLocationProximity(tech, workOrder);
        const workload = this.calculateWorkloadScore(tech.current_workload);
        const availability = tech.is_available ? 1.0 : 0.0;
        const pastPerformance = await this.getPastPerformance(tech.id, workOrder);

        const factors = {
          skills_match: skillsMatch,
          location_proximity: locationProximity,
          workload: workload,
          availability: availability,
          past_performance: pastPerformance
        };

        // Calculate weighted confidence score
        const confidenceScore = (
          factors.skills_match * 0.3 +
          factors.location_proximity * 0.2 +
          factors.workload * 0.2 +
          factors.availability * 0.1 +
          factors.past_performance * 0.2
        );

        return {
          technician_id: tech.id,
          confidence_score: Math.min(confidenceScore, 1.0),
          factors,
          reasoning: this.generateTechnicianReasoning(tech, factors, workOrder)
        };
      })
    );

    // Sort by confidence score and return top 5
    return evaluations
      .sort((a, b) => b.confidence_score - a.confidence_score)
      .slice(0, 5);
  }

  private async evaluateVendors(
    workOrderId: number, 
    organizationId: number, 
    workOrder: any
  ): Promise<VendorAssignment[]> {
    const query = `
      SELECT v.*, 
             (SELECT AVG(CASE WHEN wo.status = 'completed' 
                   THEN (SELECT AVG(CASE WHEN wof.user_feedback = 'positive' THEN 1 
                                         WHEN wof.user_feedback = 'negative' THEN 0 
                                         ELSE 0.5 END) 
                        FROM work_order_feedback wof WHERE wof.work_order_id = wo.id) 
                   ELSE 0.5 END) 
              FROM work_orders wo 
              WHERE wo.assigned_vendor_id = v.id AND wo.organization_id = ?
             ) as performance_score
      FROM vendors v
      WHERE v.organization_id = ? AND v.is_active = TRUE
      ORDER BY v.average_rating DESC
    `;

    const vendors = await executeQuery(query, [organizationId, organizationId]);

    const evaluations = vendors.map((vendor: any) => {
      const specialtyMatch = this.calculateSpecialtyMatch(vendor, workOrder);
      const costRating = this.calculateCostRating(vendor);
      const responseTime = this.calculateResponseTimeScore(vendor);
      const reliability = vendor.average_rating / 5.0; // Normalize to 0-1

      const factors = {
        specialty_match: specialtyMatch,
        cost_rating: costRating,
        response_time: responseTime,
        reliability: reliability
      };

      // Calculate weighted confidence score
      const confidenceScore = (
        factors.specialty_match * 0.3 +
        factors.cost_rating * 0.2 +
        factors.response_time * 0.2 +
        factors.reliability * 0.3
      );

      return {
        vendor_id: vendor.id,
        confidence_score: Math.min(confidenceScore, 1.0),
        factors,
        reasoning: this.generateVendorReasoning(vendor, factors, workOrder),
        estimated_cost: this.estimateVendorCost(vendor, workOrder),
        estimated_response_time_hours: this.estimateVendorResponseTime(vendor)
      };
    });

    // Sort by confidence score and return top 5
    return evaluations
      .sort((a, b) => b.confidence_score - a.confidence_score)
      .slice(0, 5);
  }

  private async calculateSkillsMatch(technician: any, workOrder: any): Promise<number> {
    if (!workOrder.asset_category_id || !technician.specializations) {
      return 0.5; // Default score if no data
    }

    try {
      // Get category requirements
      const categoryQuery = `
        SELECT required_skills FROM asset_categories WHERE id = ?
      `;
      const category = await executeQuery(categoryQuery, [workOrder.asset_category_id]);

      if (category.length === 0 || !category[0].required_skills) {
        return 0.5;
      }

      const requiredSkills = Array.isArray(category[0].required_skills) 
        ? category[0].required_skills 
        : JSON.parse(category[0].required_skills || '[]');

      const techSkills = Array.isArray(technician.specializations)
        ? technician.specializations
        : JSON.parse(technician.specializations || '[]');

      // Calculate match percentage
      const matchCount = requiredSkills.filter((skill: string) => 
        techSkills.some((techSkill: string) => 
          techSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(techSkill.toLowerCase())
        )
      ).length;

      return requiredSkills.length > 0 ? matchCount / requiredSkills.length : 0.5;
    } catch (error) {
      logger.error('Error calculating skills match:', error);
      return 0.5;
    }
  }

  private calculateLocationProximity(technician: any, workOrder: any): number {
    if (!technician.current_location || !workOrder.asset_location) {
      return 0.5;
    }

    // Simple proximity calculation - in production, use actual geolocation
    const techLocation = technician.current_location.toLowerCase();
    const assetLocation = workOrder.asset_location.toLowerCase();

    if (techLocation === assetLocation) {
      return 1.0;
    }

    // Check if same site
    if (workOrder.site_name && techLocation.includes(workOrder.site_name.toLowerCase())) {
      return 0.8;
    }

    // Check if nearby
    const techWords = techLocation.split(' ');
    const assetWords = assetLocation.split(' ');
    const commonWords = techWords.filter((word: string) => 
      assetWords.some((assetWord: string) => assetWord.includes(word) || word.includes(assetWord))
    );

    return commonWords.length > 0 ? 0.6 : 0.3;
  }

  private calculateWorkloadScore(currentWorkload: number): number {
    // Lower workload = higher score
    if (currentWorkload === 0) return 1.0;
    if (currentWorkload <= 2) return 0.8;
    if (currentWorkload <= 4) return 0.6;
    if (currentWorkload <= 6) return 0.4;
    return 0.2;
  }

  private async getPastPerformance(technicianId: number, workOrder: any): Promise<number> {
    try {
      const query = `
        SELECT AVG(
          CASE 
            WHEN wof.user_feedback = 'positive' THEN 1.0
            WHEN wof.user_feedback = 'negative' THEN 0.0
            ELSE 0.5
          END
        ) as avg_feedback
        FROM work_orders wo
        LEFT JOIN work_order_feedback wof ON wo.id = wof.work_order_id
        WHERE wo.assigned_technician_id = ? 
        AND wo.status = 'completed'
        AND wo.completed_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
      `;

      const result = await executeQuery(query, [technicianId]);
      return result[0]?.avg_feedback || 0.5;
    } catch (error) {
      logger.error('Error getting past performance:', error);
      return 0.5;
    }
  }

  private calculateSpecialtyMatch(vendor: any, workOrder: any): number {
    if (!vendor.specialty || !workOrder.category_name) {
      return 0.5;
    }

    const vendorSpecialty = vendor.specialty.toLowerCase();
    const category = workOrder.category_name.toLowerCase();

    if (vendorSpecialty.includes(category)) {
      return 1.0;
    }

    // Check for related terms
    const hvacTerms = ['hvac', 'heating', 'ventilation', 'air conditioning'];
    const electricalTerms = ['electrical', 'electric', 'power'];
    const plumbingTerms = ['plumbing', 'pipe', 'water'];

    const specialtyWords = vendorSpecialty.split(' ');
    
    if (hvacTerms.some((term: string) => category.includes(term)) && 
        specialtyWords.some((word: string) => hvacTerms.includes(word))) {
      return 0.8;
    }

    if (electricalTerms.some((term: string) => category.includes(term)) && 
        specialtyWords.some((word: string) => electricalTerms.includes(word))) {
      return 0.8;
    }

    if (plumbingTerms.some((term: string) => category.includes(term)) && 
        specialtyWords.some((word: string) => plumbingTerms.includes(word))) {
      return 0.8;
    }

    return 0.3;
  }

  private calculateCostRating(vendor: any): number {
    // In production, this would use actual cost data
    // For now, use rating as proxy (higher rating = better value)
    return (vendor.average_rating || 3.0) / 5.0;
  }

  private calculateResponseTimeScore(vendor: any): number {
    if (!vendor.service_level_agreement) {
      return 0.5;
    }

    const sla = vendor.service_level_agreement.toLowerCase();
    
    if (sla.includes('immediate') || sla.includes('1 hour')) return 1.0;
    if (sla.includes('2 hour') || sla.includes('2hr')) return 0.8;
    if (sla.includes('4 hour') || sla.includes('4hr')) return 0.6;
    if (sla.includes('24 hour') || sla.includes('same day')) return 0.4;
    
    return 0.2;
  }

  private generateTechnicianReasoning(technician: any, factors: any, workOrder: any): string {
    const reasons = [];
    
    if (factors.skills_match > 0.7) {
      reasons.push('Strong skills match');
    }
    if (factors.location_proximity > 0.7) {
      reasons.push('Close to work site');
    }
    if (factors.workload > 0.7) {
      reasons.push('Low current workload');
    }
    if (factors.past_performance > 0.7) {
      reasons.push('Good past performance');
    }

    return reasons.length > 0 ? reasons.join(', ') : 'Available technician';
  }

  private generateVendorReasoning(vendor: any, factors: any, workOrder: any): string {
    const reasons = [];
    
    if (factors.specialty_match > 0.7) {
      reasons.push('Specialty matches');
    }
    if (factors.reliability > 0.7) {
      reasons.push('High reliability');
    }
    if (factors.response_time > 0.7) {
      reasons.push('Fast response time');
    }
    if (factors.cost_rating > 0.7) {
      reasons.push('Good value');
    }

    return reasons.length > 0 ? reasons.join(', ') : 'Available vendor';
  }

  private estimateVendorCost(vendor: any, workOrder: any): number {
    // Simple cost estimation - in production, use more sophisticated pricing
    const baseCost = 150; // Base hourly rate
    const multiplier = 1 + (5 - vendor.average_rating) * 0.1; // Higher rating = lower multiplier
    return baseCost * multiplier;
  }

  private estimateVendorResponseTime(vendor: any): number {
    if (!vendor.service_level_agreement) {
      return 4; // Default 4 hours
    }

    const sla = vendor.service_level_agreement.toLowerCase();
    
    if (sla.includes('immediate') || sla.includes('1 hour')) return 1;
    if (sla.includes('2 hour') || sla.includes('2hr')) return 2;
    if (sla.includes('4 hour') || sla.includes('4hr')) return 4;
    if (sla.includes('24 hour') || sla.includes('same day')) return 8;
    
    return 4;
  }

  private determineBestAssignment(
    technicians: TechnicianAssignment[], 
    vendors: VendorAssignment[], 
    workOrder: any
  ): {
    type: 'technician' | 'vendor';
    id: number;
    confidence_score: number;
    reasoning: string;
  } {
    // Get best technician and vendor
    const bestTech = technicians.length > 0 ? technicians[0] : null;
    const bestVendor = vendors.length > 0 ? vendors[0] : null;

    // Priority rules
    if (bestTech && bestTech.confidence_score > 0.7) {
      // Strong technician match - prefer internal resource
      return {
        type: 'technician',
        id: bestTech.technician_id,
        confidence_score: bestTech.confidence_score,
        reasoning: bestTech.reasoning
      };
    }

    if (bestVendor && bestVendor.confidence_score > 0.7) {
      // Strong vendor match
      return {
        type: 'vendor',
        id: bestVendor.vendor_id,
        confidence_score: bestVendor.confidence_score,
        reasoning: bestVendor.reasoning
      };
    }

    // Choose highest confidence
    if (bestTech && (!bestVendor || bestTech.confidence_score >= bestVendor.confidence_score)) {
      return {
        type: 'technician',
        id: bestTech.technician_id,
        confidence_score: bestTech.confidence_score,
        reasoning: bestTech.reasoning
      };
    }

    if (bestVendor) {
      return {
        type: 'vendor',
        id: bestVendor.vendor_id,
        confidence_score: bestVendor.confidence_score,
        reasoning: bestVendor.reasoning
      };
    }

    // Fallback - no recommendations available
    throw new Error('No suitable technicians or vendors available for assignment');
  }
}