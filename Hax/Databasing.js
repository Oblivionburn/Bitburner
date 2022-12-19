import {colors} from "./Hax/UI.js";

/** @param {NS} ns */
export async function main(ns)
{
    ns.disableLog("ALL");
    //ns.tail(ns.getScriptName(), "home");
    
    while (true)
    {
        ns.clearLog();
        await Log(ns);
        await ns.sleep(1000);
    }
}

export async function Log(ns)
{
    ns.print(`${colors["yellow"] + "Data stored:"}`);

    let table = await Load(ns);
    if (table != null &&
        table.length > 0)
    {
        for (let i = 0; i < table.length; i++)
        {
            let data = table[i];
            ns.print(`${colors["white"] + data.Name}`);
        }
    }
    else
    {
        ns.print(`${colors["red"] + "Nothing"}`);
    }
}

export async function Save(ns, table)
{
    let tableStr = JSON.stringify(table);
    ns.write("/Hax/Database.txt", tableStr, "w");
}

export async function Load(ns)
{
    let tableStr = ns.read("/Hax/Database.txt");
    if (tableStr)
    {
        return JSON.parse(tableStr);
    }
    
    return null;
}

export async function Insert(ns, data)
{
    if (data != null)
    {
        let updated = await Update(ns, data);
        if (!updated)
		{
            let table = await Load(ns);
            if (table != null)
            {
                table.push(data);
                await Save(ns, table);
                return true;
            }
            else
            {
                let table = [];
                table.push(data);
                await Save(ns, table);
                return true;
            }
		}
		else
        {
            return true;
        }
    }

	return false;
}

export async function Update(ns, data)
{
	if (data != null)
    {
        let table = await Load(ns);
        if (table != null &&
            table.length > 0)
        {
			let count = table.length;
            for (let i = 0; i < count; i++)
            {
                let record = table[i];
                if (record.Name == data.Name)
                {
                    table[i] = data;
                    await Save(ns, table);
                    return true;
                }
            }
        }
    }

	return false;
}

export async function Delete(ns, dataName)
{
    let table = await Load(ns);
    if (table != null &&
        table.length > 0)
    {
        let count = table.length;
        for (let i = 0; i < count; i++)
        {
            let record = table[i];
            if (record.Name == dataName)
            {
                table.splice(i, 1);
                await Save(ns, table);
                return true;
            }
        }
    }

    return false;
}

export async function Select(ns, dataName)
{
    let table = await Load(ns);
    if (table != null &&
        table.length > 0)
    {
        let count = table.length;
        for (let i = 0; i < count; i++)
        {
            let record = table[i];
            if (record.Name == dataName)
            {
                return record.List;
            }
        }
    }
	
    return null;
}