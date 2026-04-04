import { describe, expect, it, vi } from 'vitest';
import { setMandalaDetailSidebarClosedForFile } from 'src/obsidian/events/workspace/effects/set-mandala-detail-sidebar-closed-for-file';

describe('setMandalaDetailSidebarClosedForFile', () => {
    it('persists a closed detail sidebar state for the target file', () => {
        const dispatch = vi.fn();
        const plugin = {
            settings: {
                getValue: () => ({
                    view: {
                        mandalaGridOrientation: 'left-to-right',
                    },
                }),
                dispatch,
            },
        };

        setMandalaDetailSidebarClosedForFile(
            plugin as never,
            'plans/day-plan.md',
        );

        expect(dispatch).toHaveBeenCalledWith({
            type: 'settings/documents/persist-mandala-view-state',
            payload: {
                path: 'plans/day-plan.md',
                gridOrientation: 'left-to-right',
                selectedLayoutId: null,
                lastActiveSection: null,
                subgridTheme: null,
                showDetailSidebarDesktop: false,
                showDetailSidebarMobile: false,
            },
        });
    });
});
