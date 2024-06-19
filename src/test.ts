import Builder from "./helper/Builder";
import IItem from "./interfaces/IItem";

const items: IItem[] = [{"sES":"co","sFaction":"None","sName":"Enchanted Chrono Centurion","iStk":"1","iQtyRemain":"-1","iQSindex":"-1","bStaff":"0","iDPS":"100","iQSvalue":"0","iClass":"0","iRty":"30","iCost":900,"ItemID":"82718","sType":"Armor","iReqRep":"0","EnhID":"0","bCoins":"1","ShopItemID":"51584","sFile":"DmnkChrono2023.swf","iRng":"10","iQty":1,"bTemp":"0","sElmt":"None","sLink":"DmnkChrono2023","sIcon":"iwarmor","bUpg":"0","iReqCP":"0","bHouse":"0","FactionID":"1","iLvl":"1","sDesc":"Even the Archfiend gives pause when gazing at these wings. They're what's left of a power similar to his, rendered meaningless in the bowls of the Void.)"}];

items.forEach(item => console.log(Builder.queryInsert('items', {
    'Name': item.sName,
    'Description': item.sDesc,
    'File': item.sFile,
    'Link': item.sLink,
    'Icon': item.sIcon,
    'TypeItemID': {
        'query': `(SELECT id FROM types_items WHERE Name = '${item.sType}' AND EquipSpot = '${item.sES}')`
    }
})))