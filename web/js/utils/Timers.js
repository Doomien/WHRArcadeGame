/**
 * Timers - Deterministic timer utilities for game logic
 *
 * These utilities use scene-based time tracking instead of raw setTimeout/setInterval
 * to ensure consistent behavior across frame rates and browser conditions.
 *
 * Features:
 * - Scene-driven timing (no drift from browser timer throttling)
 * - Cancelable schedules
 * - Repeating timers
 * - Promise-based waitFor helper for async patterns
 *
 * Usage:
 *   const timers = new Timers(scene);
 *   const handle = timers.schedule(1000, () => console.log('delayed'));
 *   timers.cancel(handle);
 */
class Timers {
  constructor(scene) {
    this.scene = scene;
    this.nextId = 1;
    this.scheduled = new Map();
    this.repeating = new Map();
  }

  /**
   * Schedule a callback to run after a delay
   * @param {number} delayMs - Delay in milliseconds
   * @param {Function} callback - Function to call after delay
   * @param {Object} context - Context (this) for the callback
   * @returns {number} - Handle for canceling
   */
  schedule(delayMs, callback, context = null) {
    const id = this.nextId++;
    const targetTime = this.scene.time.now + delayMs;

    this.scheduled.set(id, {
      targetTime,
      callback,
      context
    });

    return id;
  }

  /**
   * Schedule a callback to repeat at regular intervals
   * @param {number} intervalMs - Interval in milliseconds
   * @param {Function} callback - Function to call each interval
   * @param {Object} context - Context (this) for the callback
   * @returns {number} - Handle for canceling
   */
  every(intervalMs, callback, context = null) {
    const id = this.nextId++;
    const targetTime = this.scene.time.now + intervalMs;

    this.repeating.set(id, {
      intervalMs,
      targetTime,
      callback,
      context
    });

    return id;
  }

  /**
   * Cancel a scheduled or repeating timer
   * @param {number} handle - Handle returned from schedule() or every()
   * @returns {boolean} - True if timer was found and canceled
   */
  cancel(handle) {
    if (this.scheduled.has(handle)) {
      this.scheduled.delete(handle);
      return true;
    }
    if (this.repeating.has(handle)) {
      this.repeating.delete(handle);
      return true;
    }
    return false;
  }

  /**
   * Update all timers (call from scene update loop)
   * @param {number} time - Current scene time
   */
  update(time) {
    // Process scheduled (one-time) timers
    for (const [id, timer] of this.scheduled.entries()) {
      if (time >= timer.targetTime) {
        try {
          timer.callback.call(timer.context);
        } catch (error) {
          console.error('[Timers] Error in scheduled callback:', error);
        }
        this.scheduled.delete(id);
      }
    }

    // Process repeating timers
    for (const [id, timer] of this.repeating.entries()) {
      if (time >= timer.targetTime) {
        try {
          timer.callback.call(timer.context);
        } catch (error) {
          console.error('[Timers] Error in repeating callback:', error);
        }
        // Schedule next occurrence
        timer.targetTime = time + timer.intervalMs;
      }
    }
  }

  /**
   * Cancel all timers
   */
  cancelAll() {
    this.scheduled.clear();
    this.repeating.clear();
  }

  /**
   * Get count of active timers
   * @returns {Object} - { scheduled, repeating, total }
   */
  getActiveCount() {
    return {
      scheduled: this.scheduled.size,
      repeating: this.repeating.size,
      total: this.scheduled.size + this.repeating.size
    };
  }

  /**
   * Promise-based wait helper for scripted sequences
   * Note: This uses real-time Promise with setTimeout, not scene time.
   * For deterministic gameplay, prefer schedule() instead.
   *
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise} - Resolves after delay
   */
  static waitFor(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Destroy the timer system
   */
  destroy() {
    this.cancelAll();
    this.scene = null;
  }
}

/**
 * TimerHandle - Convenience wrapper for managing a single timer
 */
class TimerHandle {
  constructor(timers, handle) {
    this.timers = timers;
    this.handle = handle;
    this.canceled = false;
  }

  /**
   * Cancel this timer
   */
  cancel() {
    if (!this.canceled && this.timers) {
      this.canceled = this.timers.cancel(this.handle);
    }
    return this.canceled;
  }

  /**
   * Check if timer is still active
   * @returns {boolean}
   */
  isActive() {
    return !this.canceled;
  }
}
