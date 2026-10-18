import { afterEach, describe, expect, it, vi } from 'vitest';
import { createWorkingSetCooldown } from 'src/view/helpers/working-set-cooldown';

describe('working-set cooldown', () => {
    afterEach(() => {
        vi.useRealTimers();
    });
    it('coalesces saves and waits until the editor or swap is idle', () => {
        vi.useFakeTimers();
        const cool = vi.fn().mockReturnValueOnce(false).mockReturnValue(true);
        const cooldown = createWorkingSetCooldown(cool);
        cooldown.schedule();
        vi.advanceTimersByTime(1000);
        cooldown.schedule();
        vi.advanceTimersByTime(1199);
        expect(cool).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1);
        expect(cool).toHaveBeenCalledTimes(1);
        vi.advanceTimersByTime(1200);
        expect(cool).toHaveBeenCalledTimes(2);
        vi.advanceTimersByTime(5000);
        expect(cool).toHaveBeenCalledTimes(2);
    });
    it('cancels pending and retried cooling when a view closes', () => {
        vi.useFakeTimers();
        const cool = vi.fn(() => false);
        const cooldown = createWorkingSetCooldown(cool);
        cooldown.schedule();
        vi.advanceTimersByTime(1200);
        cooldown.cancel();
        vi.advanceTimersByTime(5000);
        expect(cool).toHaveBeenCalledTimes(1);
    });
});
