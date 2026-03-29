import type { NodeStyle } from 'src/mandala-settings/state/types/style-rules-types';

export type CellSectionIndicatorVariant =
    | 'plain'
    | 'plain-with-pin'
    | 'section-capsule';

export type CellSectionMetaVariant = 'plain' | 'capsule' | 'background';

export type CellTextTone = 'dark' | 'light';

export type CellStyle = NodeStyle | undefined;
