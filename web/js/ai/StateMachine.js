/**
 * StateMachine - Reusable state machine for enemy AI
 *
 * Features:
 * - Named states with enter/update/exit callbacks
 * - Explicit transitions with guards to prevent re-entrance
 * - Debug tracing for development
 * - Delta-time driven updates
 *
 * Usage:
 *   const sm = new StateMachine('EnemyName');
 *   sm.registerState('idle', {
 *     enter: (prevState) => console.log('entering idle'),
 *     update: (dt) => { ... },
 *     exit: (nextState) => console.log('exiting idle')
 *   });
 *   sm.transition('idle');
 *   sm.update(deltaTime);
 */
class StateMachine {
  constructor(name = 'StateMachine', debugMode = false) {
    this.name = name;
    this.debugMode = debugMode;
    this.states = new Map();
    this.currentState = null;
    this.currentStateName = null;
    this.stateStartTime = 0;
  }

  /**
   * Register a state with optional enter/update/exit callbacks
   * @param {string} stateName - Unique identifier for the state
   * @param {Object} callbacks - { enter, update, exit }
   */
  registerState(stateName, callbacks = {}) {
    if (this.states.has(stateName)) {
      console.warn(`[${this.name}] State '${stateName}' already registered, overwriting.`);
    }

    this.states.set(stateName, {
      enter: callbacks.enter || null,
      update: callbacks.update || null,
      exit: callbacks.exit || null
    });

    if (this.debugMode) {
      console.log(`[${this.name}] Registered state: ${stateName}`);
    }
  }

  /**
   * Transition to a new state
   * @param {string} stateName - Name of the state to transition to
   * @param {boolean} force - Force transition even if already in this state
   * @returns {boolean} - True if transition succeeded
   */
  transition(stateName, force = false) {
    // Check if state exists
    if (!this.states.has(stateName)) {
      console.error(`[${this.name}] Cannot transition to unknown state: ${stateName}`);
      return false;
    }

    // Prevent re-entrance unless forced
    if (this.currentStateName === stateName && !force) {
      if (this.debugMode) {
        console.warn(`[${this.name}] Already in state '${stateName}', skipping transition.`);
      }
      return false;
    }

    const previousStateName = this.currentStateName;
    const previousState = this.currentState;

    // Exit current state
    if (previousState && previousState.exit) {
      try {
        previousState.exit(stateName);
      } catch (error) {
        console.error(`[${this.name}] Error in exit callback for '${previousStateName}':`, error);
      }
    }

    // Transition to new state
    this.currentStateName = stateName;
    this.currentState = this.states.get(stateName);
    this.stateStartTime = Date.now();

    if (this.debugMode) {
      console.log(`[${this.name}] ${previousStateName || 'none'} -> ${stateName}`);
    }

    // Enter new state
    if (this.currentState.enter) {
      try {
        this.currentState.enter(previousStateName);
      } catch (error) {
        console.error(`[${this.name}] Error in enter callback for '${stateName}':`, error);
      }
    }

    return true;
  }

  /**
   * Update the current state
   * @param {number} dt - Delta time in milliseconds
   */
  update(dt) {
    if (!this.currentState) {
      return;
    }

    if (this.currentState.update) {
      try {
        this.currentState.update(dt);
      } catch (error) {
        console.error(`[${this.name}] Error in update callback for '${this.currentStateName}':`, error);
      }
    }
  }

  /**
   * Get the current state name
   * @returns {string|null}
   */
  getCurrentState() {
    return this.currentStateName;
  }

  /**
   * Get time spent in current state (milliseconds)
   * @returns {number}
   */
  getStateTime() {
    return Date.now() - this.stateStartTime;
  }

  /**
   * Check if currently in a specific state
   * @param {string} stateName
   * @returns {boolean}
   */
  isInState(stateName) {
    return this.currentStateName === stateName;
  }

  /**
   * Enable/disable debug tracing
   * @param {boolean} enabled
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  /**
   * Get all registered state names
   * @returns {string[]}
   */
  getStateNames() {
    return Array.from(this.states.keys());
  }

  /**
   * Clear all states and reset
   */
  reset() {
    if (this.currentState && this.currentState.exit) {
      try {
        this.currentState.exit(null);
      } catch (error) {
        console.error(`[${this.name}] Error during reset:`, error);
      }
    }

    this.currentState = null;
    this.currentStateName = null;
    this.stateStartTime = 0;
  }

  /**
   * Destroy the state machine
   */
  destroy() {
    this.reset();
    this.states.clear();
  }
}
