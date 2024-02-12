import {HotColumn} from "@handsontable/react";
import 'handsontable/dist/handsontable.full.min.css';
import {registerAllModules} from 'handsontable/registry';
import {TableContextProvider} from "./TableContext.tsx";
import {Table} from "./Table.tsx";

registerAllModules();

const fakeData = Array(300)
    .fill(0)
    .map(() => Array<number>(20).fill(0));

function App() {
  return (
    <TableContextProvider>
        <Table data={fakeData} autoColumnSize={false} autoRowSize={false}>
            {
                Array(20).fill(null).map((_, i) => (
                    <HotColumn key={i}></HotColumn>
                ))
            }
        </Table>
    </TableContextProvider>
  )
}

export default App
