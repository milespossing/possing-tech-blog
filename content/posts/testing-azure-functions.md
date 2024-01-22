---
title: Azure Functions Testing
tags:
  - azure functions
  - testing
date: 2024-01-22
---

With the introduction of typescript I've had a few opportunities to debug azure functions in some new ways.
I've outlined a few of these new mechanisms here. One of the first things to note which doesn't appear to
have been true for the babel transpilation is that we can now properly set breakpoints and listen on the
typescript code, rather than having to step through the code in the dist directory. Another method I will
be reviewing is how we can call azure functions through an http interface, rather than using azure service
bus. This is advantageous as developers don't need to elevate PIM and we don't need to maintain workspace
topics to submit changes to our functions. Further, it is possible to save and send json and csv files
more rapidly and programatically for local testing.

## Azure Functions with Language Worker 

This tutorial assumes the reader is currently able to successfully start the azure functions host using
the command `func start`.

There are 2 main components to debugging the azure functions--The main process, and the listener. The
listener could be any javascript debugger (I use webstorm), including VS Code, and Chrome. The main
process is a simple command which depends on the `func` command (included in 
[azure functions core tools](https://learn.microsoft.com/en-us/azure/azure-functions/functions-core-tools-reference?tabs=v2)).

In order to start the main process with a listener, the process can be run as normal with one additional
parameter set. For example, if the calc engine functions host were to be started for the calc-azure anc
the calc-tla threads with the following command:

```sh
func start --functions calc-azure calc-tla
```

then we could also run this with node listening for debuggers on the port 5858 with the following command:

```sh
func start --functions calc-azure calc-tla --language-worker -- --inspect=5858
```

The added potion of this command `language-worker` ensures that node is passed the `inspect` argument.
At this point our main process should be running and listening on port 5858.

## Attaching to a typescript functions host

Once the azure functions host is running and listening on port 5858, it is a simple matter to attach
a JS debugger to the host. On webstorm this is as simple as setting up a debugger configuration, and
on vs code it is as simple as adding one more run config to your launch.json file:

```json
{
    "configurations": [
        {
            "name": "Attach to Functions Host",
            "type": "node",
            "request": "attach",
            "port": 5858
        }
    ]
}
```

It is important to note that, if your tsconfig.json is set up as it is in calc-engine, a breakpoint
set anywhere in a typescript file (or js file outside of dist) should be recognized by the debugger.
I haven't tested this in a pre-typescript environment, but it's certainly a lot more convenient than
having to set breakpoints in the dist directory.

## Sending transactions via http

Azure functions also has a poorly documented http interface even for non-http triggered functions.
The broader documentation is covered
[here](https://learn.microsoft.com/en-us/azure/azure-functions/functions-manually-run-non-http),
but it's likely easiest to follow the steps I have here.

Generally speaking the non-http interface for azure functions is accessed by sending POST requests
to the url http(s)://{host}/admin/functions/{functionName}. There are a couple of headers, and
when running locally, some port requirements, which are best formalized in the following curl
command to post to the `calc-tla` function:

```sh
curl -X POST \
  -H 'Content-Type: application/json' \
  -D '{ "some": "JSON Data" }' \
	http://localhost:7071/admin/functions/calc-tla
```

Now I actually prefer to use [nushell](https://www.nushell.sh) to perform the above:

```sh
http post -t application/json -H [Content-Type application/json] http://localhost:7071/admin/functions/function { input: "{ \"this_is\": \"data\" }" }

# or more easily
http post -t application/json -H [Content-Type application/json] http://localhost:7071/admin/functions/function { input: (open the-test-data.json | to json) }
```


### For Service Bus Triggers

The API for service bus requires the following schema in the body:

```JSON
{
	"input": "{ \"JSON\": \"String\" }"
}
```

The above would be deserialized by azure functions to contain the following message:

```javascript
const message = { JSON: "String" };
```

It is perhaps better to formalize this with the following typescript program (used by calc-engine):

```typescript
import { Command } from 'commander';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import axios from 'axios';

const program = new Command();

const path = 'http://localhost:7071/admin/functions/';
program
  .argument('functionName')
  .argument('filePath')
  .option('-t')
  .action(async (functionName: string, filePath: string, options: { t: boolean }) => {
    const fileText = fs.readFileSync(filePath).toString();
    const functionPath = path + functionName;
    const logJson = data => console.log(JSON.stringify(data, null, 2));
    const postMessage = async message =>
      options.t
        ? logJson(message)
        : axios
            .post(
              functionPath,
              { input: JSON.stringify(message) },
              { headers: { 'Content-Type': 'application/json' } },
            )
            .catch(logJson);
    const messages: [] = parse(fileText, { columns: true });
    await Promise.all(messages.map(postMessage));
  });

program.parseAsync(process.argv).then(() => process.exit());
```

The above reads a csv file on the path, de/serializes it into a JSON object, and sends it
to the correct endpoint. This form of testing is a good compliment to the testing performed
in the DRI toolkit on calc engine currently. Any time Steve recieves an output which is
not expected, it is very easy for a developer to perform exactly the same operation locally
with only the excel file he provided, but to debug and introspect code step by step.
