import Handsontable from 'handsontable';
import { HiddenColumns } from 'handsontable/plugins';
import { OperationType } from 'handsontable/plugins/filters';
import {createContext, Dispatch, Reducer, RefObject, useCallback, useContext, useReducer} from 'react';
import {HotTable} from "@handsontable/react";

type HotTableInstance = NonNullable<Parameters<HotTable>[0]['ref']> extends infer T ? (T extends RefObject<infer I> ? I : never) : never; // cool of them not to export this type directly

export type ColumnFilter = [column: number, name: string, args: unknown[], operationId?: OperationType];
export type TableContextState = {
    instance?: HotTableInstance;
    columnSettings?: Array<Handsontable.ColumnSettings>;
    hiddenColumns?: Array<number>;
    hiddenRows?: Array<number>;
    columnFilters?: Array<ColumnFilter>;
};

const tag: unique symbol = Symbol('tag');
type TypeTemplate<T> = { [tag]: T };

const type = <T>() => undefined as unknown as TypeTemplate<T>;

function createAction<Type extends string, Payload>(type: Type, _payloadType: () => TypeTemplate<Payload>): (payload: Payload) => { [tag]: Type; payload: Payload } {
    return (payload) => ({ [tag]: type, payload });
}

/* actions */
const setTableInstance = createAction('SET_INSTANCE', type<HotTableInstance>); // only for internal use
const setColumSettings = createAction('SET_COLUMN_SETTINGS', type<Array<Handsontable.ColumnSettings>>); // only for internal use
export const setHiddenColumns = createAction('SET_HIDDEN_COLUMNS', type<Array<number>>);
export const setHiddenRows = createAction('SET_HIDDEN_ROWS', type<Array<number>>);
export const hideTableColumn = createAction('HIDE_COLUMN', type<number>);
export const showTableColumn = createAction('SHOW_COLUMN', type<number>);
export const toggleTableColumnVisibility = createAction('TOGGLE_COLUMN_VISIBILITY', type<number>);
export const setColumnFilters = createAction('SET_COLUMN_FILTERS', type<Array<ColumnFilter>>);
export const addColumnFilter = createAction('ADD_COLUMN_FILTER', type<ColumnFilter>);
export const removeColumnFilter = createAction('REMOVE_COLUMN_FILTER', type<number>);

export type TableContextAction =
    | ReturnType<typeof setTableInstance>
    | ReturnType<typeof setColumSettings>
    | ReturnType<typeof setHiddenColumns>
    | ReturnType<typeof setHiddenRows>
    | ReturnType<typeof hideTableColumn>
    | ReturnType<typeof showTableColumn>
    | ReturnType<typeof toggleTableColumnVisibility>
    | ReturnType<typeof setColumnFilters>
    | ReturnType<typeof addColumnFilter>
    | ReturnType<typeof removeColumnFilter>;

const tableContextReducer = (<Action extends TableContextAction>(prevState: TableContextState, action: Action): TableContextState => {
    switch (action[tag]) {
        case 'SET_INSTANCE':
            return { ...prevState, instance: action.payload };
        case 'SET_COLUMN_SETTINGS':
            return { ...prevState, columnSettings: action.payload };
        case 'SET_HIDDEN_ROWS':
            return { ...prevState, hiddenRows: action.payload };
        case 'SET_HIDDEN_COLUMNS':
            return { ...prevState, hiddenColumns: action.payload };
        case 'HIDE_COLUMN':
            return { ...prevState, hiddenColumns: [...new Set([...(prevState.hiddenColumns ?? []), action.payload])] };
        case 'SHOW_COLUMN':
            return { ...prevState, hiddenColumns: prevState.hiddenColumns?.filter((column) => column !== action.payload) };
        case 'TOGGLE_COLUMN_VISIBILITY': {
            const isHidden = prevState.hiddenColumns?.includes(action.payload) ?? false;
            if (isHidden) {
                return tableContextReducer(prevState, showTableColumn(action.payload));
            } else {
                return tableContextReducer(prevState, hideTableColumn(action.payload));
            }
        }
        case 'SET_COLUMN_FILTERS':
            return { ...prevState, columnFilters: action.payload };
        case 'ADD_COLUMN_FILTER': {
            const otherFilters = (prevState.columnFilters ?? []).filter(([column]) => column !== action.payload[0]);
            return { ...prevState, columnFilters: [...otherFilters, action.payload] };
        }
        case 'REMOVE_COLUMN_FILTER': {
            const otherFilters = (prevState.columnFilters ?? []).filter(([column]) => column !== action.payload);
            return { ...prevState, columnFilters: otherFilters };
        }
        default:
            console.warn('warning: action not mached', action);
            return prevState;
    }
}) as Reducer<TableContextState, TableContextAction>;

export const useTableContextReducer = () => {
    return useReducer(tableContextReducer, {});
};

export type TableContext = TableContextState & { dispatch: Dispatch<TableContextAction> };

const TableContext = createContext<TableContext>({
    dispatch: () => void 0,
});

export function useTableDispatch() {
    const { dispatch } = useContext(TableContext);
    return dispatch;
}

export function useTableSelector<T>(selector: (state: TableContextState) => T) {
    const { dispatch: _, ...state } = useContext(TableContext);
    return selector(state);
}

export function useTableRef() {
    const dispatch = useTableDispatch();
    return useCallback(
        (instance: HotTableInstance) => {
            if (instance) {
                const hiddenColumns = (instance.hotInstance?.getPlugin?.('hiddenColumns') as HiddenColumns).getHiddenColumns();
                dispatch(setTableInstance(instance));
                dispatch(setHiddenColumns(hiddenColumns));
                dispatch(setColumSettings(instance.columnSettings));
            }
        },
        [dispatch]
    );
}

export const TableProvider = TableContext.Provider;
