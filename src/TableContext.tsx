import {FunctionComponent, ReactNode, useMemo} from 'react';

import { TableProvider, useTableContextReducer } from './context.ts';

type WithChildren = {
    children?: ReactNode
}

export const TableContextProvider: FunctionComponent<WithChildren> = ({ children }) => {
    const [state, dispatch] = useTableContextReducer();

    const context = useMemo(() => ({ ...state, dispatch }), [state, dispatch]);

    return <TableProvider value={context}>{children}</TableProvider>;
};
