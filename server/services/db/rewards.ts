import { db } from '../../db';
import { eq } from 'drizzle-orm';
import { rewards } from '@shared/schema';

export interface DatabaseReward {
  id: number;
  name: string;
  description: string;
  type: string;
  value: number;
  code: string | null;
  image_url: string | null;
  available_from: Date;
  available_to: Date;
  quantity: number;
  required_tier: number | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ClientReward {
  id: number;
  name: string;
  description: string;
  type: string;
  value: number;
  code: string | null;
  imageUrl: string | null;
  availableFrom: Date;
  availableTo: Date;
  quantity: number;
  requiredTier: number | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Client compatibility fields
  locationRestricted: boolean;
  eligibleLocations: string[];
  redemptionPeriodDays: number;
  redemptionInstructions: string | null;
  provider: string | null;
  shippingDetails: any | null;
  terms: string | null;
}

/**
 * Convert a database reward to a client-friendly format
 */
export function mapDatabaseToClientReward(reward: DatabaseReward): ClientReward {
  return {
    id: reward.id,
    name: reward.name,
    description: reward.description,
    type: reward.type,
    value: reward.value,
    code: reward.code,
    imageUrl: reward.image_url,
    availableFrom: reward.available_from,
    availableTo: reward.available_to,
    quantity: reward.quantity,
    requiredTier: reward.required_tier,
    active: reward.active,
    createdAt: reward.created_at,
    updatedAt: reward.updated_at,
    // Default values for client compatibility
    locationRestricted: false,
    eligibleLocations: [],
    redemptionPeriodDays: 30,
    redemptionInstructions: null,
    provider: null,
    shippingDetails: null,
    terms: null
  };
}

/**
 * Get all rewards from the database
 */
export async function getAllRewards(): Promise<ClientReward[]> {
  // Get raw database data
  const rewardsData = await db.execute(`
    SELECT * FROM "rewards"
  `);
  
  // Map each record to our DatabaseReward type with proper type casting
  const typedRewards = rewardsData.rows.map(row => ({
    id: Number(row.id),
    name: String(row.name),
    description: String(row.description),
    type: String(row.type),
    value: Number(row.value),
    code: row.code === null ? null : String(row.code),
    image_url: row.image_url === null ? null : String(row.image_url),
    available_from: new Date(row.available_from),
    available_to: new Date(row.available_to), 
    quantity: Number(row.quantity),
    required_tier: row.required_tier === null ? null : Number(row.required_tier),
    active: Boolean(row.active),
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at)
  })) as DatabaseReward[];
  
  // Map to client format
  return typedRewards.map(mapDatabaseToClientReward);
}

/**
 * Get a specific reward by ID
 */
export async function getRewardById(id: number): Promise<ClientReward | null> {
  try {
    // Get raw database data
    const result = await db.execute(`
      SELECT * FROM "rewards" WHERE id = $1
    `, [id]);
    
    if (result.rowCount === 0) {
      return null;
    }
    
    const row = result.rows[0];
    
    // Map to DatabaseReward type
    const rewardData: DatabaseReward = {
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      value: row.value,
      code: row.code,
      image_url: row.image_url,
      available_from: row.available_from,
      available_to: row.available_to, 
      quantity: row.quantity,
      required_tier: row.required_tier,
      active: row.active,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
    
    // Map to client format
    return mapDatabaseToClientReward(rewardData);
  } catch (error) {
    console.error('Error getting reward by ID:', error);
    return null;
  }
}

/**
 * Create a new reward
 */
export async function createReward(data: {
  name: string;
  description: string;
  type: string;
  value: number;
  code?: string | null;
  imageUrl?: string | null;
  availableFrom: Date;
  availableTo: Date;
  quantity: number;
  requiredTier?: number | null;
  active?: boolean;
}): Promise<ClientReward | null> {
  try {
    // Use raw SQL to avoid schema mismatch issues
    const result = await db.execute(`
      INSERT INTO rewards (
        name, 
        description, 
        type, 
        value, 
        code, 
        image_url, 
        available_from, 
        available_to, 
        quantity, 
        required_tier, 
        active,
        created_at,
        updated_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      data.name,
      data.description,
      data.type,
      data.value,
      data.code || null,
      data.imageUrl || null,
      data.availableFrom,
      data.availableTo,
      data.quantity,
      data.requiredTier || null,
      data.active === undefined ? true : data.active,
      new Date(),
      new Date()
    ]);
    
    if (result.rowCount === 0) {
      return null;
    }
    
    const row = result.rows[0];
    
    // Map to DatabaseReward type
    const rewardData: DatabaseReward = {
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      value: row.value,
      code: row.code,
      image_url: row.image_url,
      available_from: row.available_from,
      available_to: row.available_to, 
      quantity: row.quantity,
      required_tier: row.required_tier,
      active: row.active,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
    
    // Map to client format
    return mapDatabaseToClientReward(rewardData);
  } catch (error) {
    console.error('Error creating reward:', error);
    return null;
  }
}

/**
 * Update an existing reward
 */
export async function updateReward(
  id: number,
  updates: Partial<Omit<ClientReward, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<ClientReward | null> {
  try {
    // Get the current reward to build our update SQL
    const currentReward = await getRewardById(id);
    
    if (!currentReward) {
      return null;
    }
    
    // Build update fields and values array
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    // Map client fields to database fields
    if (updates.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    
    if (updates.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    
    if (updates.type !== undefined) {
      updateFields.push(`type = $${paramIndex++}`);
      values.push(updates.type);
    }
    
    if (updates.value !== undefined) {
      updateFields.push(`value = $${paramIndex++}`);
      values.push(updates.value);
    }
    
    if (updates.code !== undefined) {
      updateFields.push(`code = $${paramIndex++}`);
      values.push(updates.code);
    }
    
    if (updates.imageUrl !== undefined) {
      updateFields.push(`image_url = $${paramIndex++}`);
      values.push(updates.imageUrl);
    }
    
    if (updates.availableFrom !== undefined) {
      updateFields.push(`available_from = $${paramIndex++}`);
      values.push(updates.availableFrom);
    }
    
    if (updates.availableTo !== undefined) {
      updateFields.push(`available_to = $${paramIndex++}`);
      values.push(updates.availableTo);
    }
    
    if (updates.quantity !== undefined) {
      updateFields.push(`quantity = $${paramIndex++}`);
      values.push(updates.quantity);
    }
    
    if (updates.requiredTier !== undefined) {
      updateFields.push(`required_tier = $${paramIndex++}`);
      values.push(updates.requiredTier);
    }
    
    if (updates.active !== undefined) {
      updateFields.push(`active = $${paramIndex++}`);
      values.push(updates.active);
    }
    
    // Always update the updated_at timestamp
    updateFields.push(`updated_at = $${paramIndex++}`);
    values.push(new Date());
    
    // Add the ID as the last parameter
    values.push(id);
    
    // Only proceed if we have something to update
    if (updateFields.length === 0) {
      return currentReward;
    }
    
    // Execute update query
    const result = await db.execute(`
      UPDATE rewards 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);
    
    if (result.rowCount === 0) {
      return null;
    }
    
    // Get the updated reward using our function that correctly maps fields
    return await getRewardById(id);
  } catch (error) {
    console.error('Error updating reward:', error);
    return null;
  }
}

/**
 * Delete a reward by ID
 */
export async function deleteReward(id: number): Promise<boolean> {
  try {
    const result = await db.delete(rewards)
      .where(eq(rewards.id, id))
      .returning({ id: rewards.id });
      
    return result.length > 0;
  } catch (error) {
    console.error('Error deleting reward:', error);
    return false;
  }
}