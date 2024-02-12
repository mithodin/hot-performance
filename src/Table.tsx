import {HotTable, HotTableProps} from '@handsontable/react';
import 'handsontable/dist/handsontable.full.min.css';
import {DetailedSettings as HiddenColumnsSettings} from 'handsontable/plugins/hiddenColumns';
import {registerAllModules} from 'handsontable/registry';
import {FunctionComponent, useEffect} from 'react';

import {setHiddenColumns, useTableDispatch, useTableRef, useTableSelector} from './context.ts';

export type TableProps = {
    hiddenColumns?: HiddenColumnsSettings;
} & Omit<HotTableProps, 'licenseKey' | 'hiddenColumns'>;

registerAllModules();

function useFilterPlugin() {
    return useTableSelector((state) => state.instance?.hotInstance?.getPlugin('filters'));
}

/** a simple wrapper around HotTable to provide the license key */
export const Table: FunctionComponent<TableProps> = ({ hiddenColumns: defaultHiddenColumns, children, ...props }) => {
    const tableRef = useTableRef();
    const dispatch = useTableDispatch();
    const hiddenColumns = useTableSelector((state) => ({ columns: state.hiddenColumns ?? [] }));
    const hiddenRows = useTableSelector((state) => ({ rows: state.hiddenRows ?? [] }));
    const filterPlugin = useFilterPlugin();
    const columnFilters = useTableSelector((state) => state.columnFilters ?? []);

    useEffect(() => {
        dispatch(setHiddenColumns(defaultHiddenColumns?.columns ?? []));
    }, [defaultHiddenColumns, dispatch]);

    useEffect(() => {
        if (filterPlugin) {
            if (filterPlugin.conditionCollection) {
                filterPlugin.clearConditions();
            }
            if (columnFilters.length > 0) {
                columnFilters.forEach((filter) => {
                    filterPlugin.addCondition(...filter);
                });
                filterPlugin.filter();
            }
        }
    }, [filterPlugin, columnFilters]);

    return (
        <div>
            <HotTable height="auto" ref={tableRef} licenseKey="non-commercial-and-evaluation" {...props} hiddenColumns={hiddenColumns} hiddenRows={hiddenRows}>
                {children}
            </HotTable>
        </div>
    );
};
