import {Data} from "./HackOS/Data.js";

export class Packet
{
    constructor(request, source, destination, data)
    {
        this.Request = request;
        this.Source = source;
        this.Destination = destination;
        this.Data = data;
    }
}