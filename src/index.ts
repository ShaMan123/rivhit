
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { API_Key, CUSTOMER_ID, ITEM_ID } from './EDIT_ME';
require('source-map-support').install();

interface RivhitResponse<T> {
    error_code: number,
    client_message: string,
    debug_message: string,
    data: T
}

const endPoints = {
    getItemQuantity: 'https://api.rivhit.co.il/online/RivhitOnlineAPI.svc/Item.Quantity',
    getItems: 'https://api.rivhit.co.il/online/RivhitOnlineAPI.svc/Item.List',
    getItemGroups: 'https://api.rivhit.co.il/online/RivhitOnlineAPI.svc/Item.Groups',
    getItemChildren: 'https://api.rivhit.co.il/online/RivhitOnlineAPI.svc/Item.GetChildren',
    getTypeList: 'https://api.rivhit.co.il/online/RivhitOnlineAPI.svc/Document.TypeList',
    newDocument: 'https://api.rivhit.co.il/online/RivhitOnlineAPI.svc/Document.New',
    getDocuments: 'https://api.rivhit.co.il/online/RivhitOnlineAPI.svc/Document.List',
    getDocumentDetails: 'https://api.rivhit.co.il/online/RivhitOnlineAPI.svc/Document.Details'
}

enum DOC_TYPES {
    inventory_out = 10,
    inventory_in = 11,
}

const resDir = path.resolve(__dirname, '../responses');

if (!fs.existsSync(resDir)) {
    fs.mkdirSync(resDir);
}

function writeToFile<T>(fileName: string, data: T, save: boolean = true, log: boolean = false) {
    const writeTo = path.resolve(resDir, fileName);
    if (save && data) {
        fs.writeFileSync(writeTo, JSON.stringify(data, null, '\t'));
        console.log(`sucessfully created file at ${writeTo}\n`, log ? data : '');
    } else if (!data && log) {
        console.log('not found', new Error().stack)
    }
    return data;
}

async function getItemQuantity(id: number) {
    const res = await axios.post(endPoints.getItemQuantity, {
        api_token: API_Key,
        item_id: id
    });
    console.log(res.data);
}

async function getItemChildren(id: number) {
    const res = await axios.post<any, RivhitResponse<any>>(endPoints.getItemChildren, {
        api_token: API_Key,
        item_id: id
    });
    return writeToFile('item_children.json', res.data.data);
}

async function getItems(groupID: number) {
    const res = await axios.post(endPoints.getItems, {
        api_token: API_Key,
        item_group_id: groupID
    });
    return writeToFile(`items_${groupID}.json`, res.data.data?.item_list);
}

async function getItemGroups() {
    const res = await axios.post(endPoints.getItemGroups, {
        api_token: API_Key
    });
    return writeToFile('item_groups.json', res.data.data.item_group_list);
}

async function getDocTypes() {
    const res = await axios.post(endPoints.getTypeList, {
        api_token: API_Key
    });
    return writeToFile('doc_types.json', res.data.data);
}

async function getDocuments(customerID: number, detailed: boolean = false) {
    const res = await axios.post(endPoints.getDocuments, {
        api_token: API_Key,
        "from_document_type": DOC_TYPES.inventory_out,
        "to_document_type": DOC_TYPES.inventory_in,
        "from_customer_id": customerID,
        "to_customer_id": customerID,
        "from_date": "01-01-2019",
        "to_date": "16-08-2020"
    });
    if (detailed) {
        const detailedResponse = await Promise.all(res.data.data.document_list.map(async ({ document_type, document_number }) => {
            const res1 = await axios.post(endPoints.getDocumentDetails, {
                api_token: API_Key,
                document_type,
                document_number
            });
            return res1.data;
        }));
        return writeToFile('detailed_docs.json', detailedResponse);
    } else {
        return writeToFile('docs.json', res.data);
    }
}

type ItemReq = {
    item_id: number,
    quantity: number,
    price_nis: number,
    description: string
}


async function writeInventory(action: DOC_TYPES, customerID: number, items: ItemReq[]) {
    try {
        const res = await axios.post(endPoints.newDocument, {
            api_token: API_Key,
            document_type: action,
            customer_id: customerID,
            items
        });
        return writeToFile('inventory_action.json', res.data);
    } catch (err) {
        console.log(err.toJSON())
    }

}

async function run() {
    const itemID = ITEM_ID;
    const customerID = CUSTOMER_ID;
    await getDocTypes();
    const groups = await getItemGroups();
    const itemsByGroups = await Promise.all(groups.map(g => getItems(g.item_group_id)));
    await getItemQuantity(itemID);
    await getItemChildren(itemID);
    await getDocuments(customerID, true);
    await getDocuments(customerID);
    await writeInventory(DOC_TYPES.inventory_in, customerID, [
        {
            item_id: itemID,
            quantity: 50,
            price_nis: 10.5,
            description: 'מוצר שווה'
        }
    ])
    await getItemQuantity(itemID);
}

run()


