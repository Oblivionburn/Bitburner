export class Data
{
    constructor(name)
    {
        this.name = name;
        this.list = [];
    }

    addToList(something)
    {
        if (typeof something == "string")
        {
            this.list.push(something);
        }
        else
        {
            throw "Data list only accepts string objects.";
        }
    }
}