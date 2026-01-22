import mysql from 'mysql2/promise';
import { logger } from '../utils/logger';

let pool: mysql.Pool;

export const connectDatabase = async (): Promise<void> => {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'fm_copilot',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Test connection
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    
    logger.info('MySQL database connection established');
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

export const getDatabase = (): mysql.Pool => {
  if (!pool) {
    throw new Error('Database not initialized. Call connectDatabase() first.');
  }
  return pool;
};

export const executeQuery = async <T = any>(
  query: string, 
  params: any[] = []
): Promise<T[]> => {
  try {
    const [rows] = await getDatabase().execute(query, params);
    return rows as T[];
  } catch (error) {
    logger.error('Database query error:', { query, params, error });
    throw error;
  }
};

export const executeQuerySingle = async <T = any>(
  query: string, 
  params: any[] = []
): Promise<T | null> => {
  try {
    const rows = await executeQuery<T>(query, params);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    logger.error('Database single query error:', { query, params, error });
    throw error;
  }
};

export const executeInsert = async (
  query: string, 
  params: any[] = []
): Promise<number> => {
  try {
    const [result] = await getDatabase().execute(query, params);
    const insertResult = result as mysql.ResultSetHeader;
    return insertResult.insertId;
  } catch (error) {
    logger.error('Database insert error:', { query, params, error });
    throw error;
  }
};

export const executeUpdate = async (
  query: string, 
  params: any[] = []
): Promise<number> => {
  try {
    const [result] = await getDatabase().execute(query, params);
    const updateResult = result as mysql.ResultSetHeader;
    return updateResult.affectedRows;
  } catch (error) {
    logger.error('Database update error:', { query, params, error });
    throw error;
  }
};