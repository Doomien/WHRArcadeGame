/**
 * Interaction - Defines damage/hit payloads
 *
 * Used by InteractionSystem to communicate damage between entities.
 *
 * InteractionKind:
 * - melee: Close-range physical attacks
 * - projectile: Ranged attacks
 * - environment: Environmental hazards (spikes, falls, etc.)
 */

const InteractionKind = {
  MELEE: 'melee',
  PROJECTILE: 'projectile',
  ENVIRONMENT: 'environment'
};

/**
 * Create an interaction payload
 * @param {Object} config
 * @param {string} config.kind - InteractionKind value
 * @param {string} config.sourceId - Unique ID of attacker
 * @param {string} config.sourceTeam - Team/faction (e.g., 'player', 'enemy')
 * @param {number} config.damage - Damage amount
 * @param {Object} config.knockback - Knockback vector { x, y }
 * @param {number} config.iFramesMs - Invincibility frames duration (ms)
 * @returns {Object} - Interaction payload
 */
function createInteraction(config) {
  return {
    kind: config.kind || InteractionKind.MELEE,
    sourceId: config.sourceId || 'unknown',
    sourceTeam: config.sourceTeam || 'neutral',
    damage: config.damage || 1,
    knockback: config.knockback || null,
    iFramesMs: config.iFramesMs || 0
  };
}
