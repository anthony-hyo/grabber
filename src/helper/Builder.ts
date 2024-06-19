export default class Builder {

    public static queryInsert(tableName: string, item: any): string {
        const columns: string = Object.keys(item)
            .map((column: string): string => `\`${column}\``)
            .join(", ");

        const values: string = Object.values(item)
            .map((value: any): string => {
                if (typeof value === "string") {
                    return `'${value.replace(/'/g, "\\'")}'`;
                } else if (typeof value === "object" && value.hasOwnProperty('query')) {
                    return value.query;
                } else {
                    return value;
                }
            })
            .join(", ");

        return `INSERT INTO \`${tableName}\` (${columns}) VALUES (${values});`;
    }


}