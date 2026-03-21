import clx from 'classnames';
import { ActiveStatus } from 'src/views/view-columns/components/active-status.enum';

type BuildClassicCardClassNameOptions = {
    active: ActiveStatus | null;
    confirmDelete: boolean;
    confirmDisableEdit: boolean;
    editing: boolean;
    selected: boolean;
    isSearchMatch: boolean;
};

const activeStatusClasses = {
    [ActiveStatus.node]: 'active-node',
    [ActiveStatus.child]: 'active-child',
    [ActiveStatus.parent]: 'active-parent',
    [ActiveStatus.sibling]: 'active-sibling',
};

export const buildClassicCardClassName = ({
    active,
    confirmDelete,
    confirmDisableEdit,
    editing,
    selected,
    isSearchMatch,
}: BuildClassicCardClassNameOptions): string =>
    clx(
        'mandala-card',
        active ? activeStatusClasses[active] : 'inactive-node',
        confirmDelete
            ? 'node-border--delete'
            : confirmDisableEdit
              ? 'node-border--discard'
              : editing
                ? 'node-border--editing'
                : selected
                  ? 'node-border--selected'
                  : isSearchMatch
                    ? 'node-border--search-match'
                    : active === ActiveStatus.node
                      ? 'node-border--active'
                      : undefined,
    );
