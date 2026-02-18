import fs from "fs";
import path from "path";
import mockFs from "mock-fs";
import serviceFactory from "../service";
import { pluginName } from "../../genTypes/types";

describe("gen-types service", () => {
  const cwd = process.cwd();

  afterEach(() => {
    mockFs.restore();
  });

  it("does not self-import when singleFile is false", () => {
    const schema = {
      attributes: {
        vin: { type: "string", required: true },
        siblingVehicle: {
          type: "relation",
          relation: "oneToMany",
          target: "api::vehicle.vehicle",
        },
      },
    };

    mockFs({
      [path.join(cwd, "src")]: {
        api: {
          vehicle: {
            "schema.json": JSON.stringify(schema),
          },
        },
      },
      [path.join(cwd, "genTypes")]: {},
    });

    const strapi = {
      service: jest.fn(),
      log: { info: jest.fn() },
    } as any;

    const service = serviceFactory({ strapi });

    strapi.service.mockImplementation((name: string) => {
      if (name === `plugin::${pluginName}.service`) {
        return service;
      }
      throw new Error(`Unknown service ${name}`);
    });

    const outPath = path.join(cwd, "genTypes");

    service.generateInterfaces(outPath, false, true);

    const outputFile = path.join(outPath, "vehicle.ts");
    const content = fs.readFileSync(outputFile, "utf-8");

    expect(content).toContain("export interface Vehicle");
    expect(content).toContain("siblingVehicle?: Vehicle[] | null;");
    expect(content).not.toContain("import { Vehicle }");
  });

  it("imports other models when referenced", () => {
    const vehicleSchema = {
      attributes: {
        vin: { type: "string", required: true },
        maintenanceRecords: {
          type: "relation",
          relation: "oneToMany",
          target: "api::maintenance-record.maintenance-record",
        },
      },
    };

    const maintenanceRecordSchema = {
      attributes: {
        date: { type: "date" },
        vehicle: {
          type: "relation",
          relation: "manyToOne",
          target: "api::vehicle.vehicle",
        },
      },
    };

    mockFs({
      [path.join(cwd, "src")]: {
        api: {
          vehicle: {
            "schema.json": JSON.stringify(vehicleSchema),
          },
          "maintenance-record": {
            "schema.json": JSON.stringify(maintenanceRecordSchema),
          },
        },
      },
      [path.join(cwd, "genTypes")]: {},
    });

    const strapi = {
      service: jest.fn(),
      log: { info: jest.fn() },
    } as any;

    const service = serviceFactory({ strapi });

    strapi.service.mockImplementation((name: string) => {
      if (name === `plugin::${pluginName}.service`) {
        return service;
      }
      throw new Error(`Unknown service ${name}`);
    });

    const outPath = path.join(cwd, "genTypes");

    service.generateInterfaces(outPath, false, true);

    const vehicleFile = path.join(outPath, "vehicle.ts");
    const vehicleContent = fs.readFileSync(vehicleFile, "utf-8");

    expect(vehicleContent).toContain("import { MaintenanceRecord }");
    expect(vehicleContent).toContain("maintenanceRecords?: MaintenanceRecord[] | null;");
    expect(vehicleContent).not.toContain("import { Vehicle }");

    const maintenanceFile = path.join(outPath, "maintenanceRecord.ts");
    const maintenanceContent = fs.readFileSync(maintenanceFile, "utf-8");

    expect(maintenanceContent).toContain("import { Vehicle }");
    expect(maintenanceContent).not.toContain("import { MaintenanceRecord }");
  });

  it("imports component types for component attributes", () => {
    const vehicleSchema = {
      attributes: {
        vin: { type: "string", required: true },
        serviceRecord: {
          type: "component",
          component: "fleet.service-record",
        },
      },
    };

    const componentSchema = {
      attributes: {
        cost: { type: "decimal" },
        note: { type: "text" },
      },
    };

    mockFs({
      [path.join(cwd, "src")]: {
        api: {
          vehicle: {
            "schema.json": JSON.stringify(vehicleSchema),
          },
        },
        components: {
          fleet: {
            "service-record.json": JSON.stringify(componentSchema),
          },
        },
      },
      [path.join(cwd, "genTypes")]: {},
    });

    const strapi = {
      service: jest.fn(),
      log: { info: jest.fn() },
    } as any;

    const service = serviceFactory({ strapi });

    strapi.service.mockImplementation((name: string) => {
      if (name === `plugin::${pluginName}.service`) {
        return service;
      }
      throw new Error(`Unknown service ${name}`);
    });

    const outPath = path.join(cwd, "genTypes");

    service.generateInterfaces(outPath, false, true);

    const vehicleFile = path.join(outPath, "vehicle.ts");
    const vehicleContent = fs.readFileSync(vehicleFile, "utf-8");

    expect(vehicleContent).toContain("import { FleetServiceRecord }");
    expect(vehicleContent).toContain("serviceRecord?: FleetServiceRecord | null;");
  });

  it("does not emit imports for singleFile when models are declared", () => {
    const vehicleSchema = {
      attributes: {
        vin: { type: "string", required: true },
        maintenanceRecords: {
          type: "relation",
          relation: "oneToMany",
          target: "api::maintenance-record.maintenance-record",
        },
      },
    };

    const maintenanceRecordSchema = {
      attributes: {
        date: { type: "date" },
      },
    };

    const outFile = path.join(cwd, "genTypes", "types.ts");

    mockFs({
      [path.join(cwd, "src")]: {
        api: {
          vehicle: {
            "schema.json": JSON.stringify(vehicleSchema),
          },
          "maintenance-record": {
            "schema.json": JSON.stringify(maintenanceRecordSchema),
          },
        },
      },
      [path.join(cwd, "genTypes")]: {},
    });

    const strapi = {
      service: jest.fn(),
      log: { info: jest.fn() },
    } as any;

    const service = serviceFactory({ strapi });

    strapi.service.mockImplementation((name: string) => {
      if (name === `plugin::${pluginName}.service`) {
        return service;
      }
      throw new Error(`Unknown service ${name}`);
    });

    service.generateInterfaces(outFile, true, true);

    const content = fs.readFileSync(outFile, "utf-8");

    expect(content).toContain("export interface Vehicle");
    expect(content).toContain("export interface MaintenanceRecord");
    expect(content).not.toContain("import {");
  });

  it("applies include filters for api schemas", () => {
    const vehicleSchema = {
      attributes: {
        vin: { type: "string", required: true },
      },
    };

    const maintenanceRecordSchema = {
      attributes: {
        date: { type: "date" },
      },
    };

    mockFs({
      [path.join(cwd, "src")]: {
        api: {
          vehicle: {
            "schema.json": JSON.stringify(vehicleSchema),
          },
          "maintenance-record": {
            "schema.json": JSON.stringify(maintenanceRecordSchema),
          },
        },
      },
      [path.join(cwd, "genTypes")]: {},
    });

    const strapi = {
      service: jest.fn(),
      log: { info: jest.fn() },
    } as any;

    const service = serviceFactory({ strapi });

    strapi.service.mockImplementation((name: string) => {
      if (name === `plugin::${pluginName}.service`) {
        return service;
      }
      throw new Error(`Unknown service ${name}`);
    });

    const outPath = path.join(cwd, "genTypes");

    service.generateInterfaces(outPath, false, true, ["api::vehicle.*"], []);

    expect(fs.existsSync(path.join(outPath, "vehicle.ts"))).toBe(true);
    expect(fs.existsSync(path.join(outPath, "maintenanceRecord.ts"))).toBe(false);
  });

  it("applies exclude filters for components", () => {
    const vehicleSchema = {
      attributes: {
        vin: { type: "string", required: true },
        serviceRecord: {
          type: "component",
          component: "fleet.service-record",
        },
      },
    };

    const excludedComponentSchema = {
      attributes: {
        note: { type: "text" },
      },
    };

    mockFs({
      [path.join(cwd, "src")]: {
        api: {
          vehicle: {
            "schema.json": JSON.stringify(vehicleSchema),
          },
        },
        components: {
          fleet: {
            "service-record.json": JSON.stringify(excludedComponentSchema),
          },
        },
      },
      [path.join(cwd, "genTypes")]: {},
    });

    const strapi = {
      service: jest.fn(),
      log: { info: jest.fn() },
    } as any;

    const service = serviceFactory({ strapi });

    strapi.service.mockImplementation((name: string) => {
      if (name === `plugin::${pluginName}.service`) {
        return service;
      }
      throw new Error(`Unknown service ${name}`);
    });

    const outPath = path.join(cwd, "genTypes");

    service.generateInterfaces(outPath, false, true, [], ["component::fleet.service-record"]);

    const vehicleFile = path.join(outPath, "vehicle.ts");
    const vehicleContent = fs.readFileSync(vehicleFile, "utf-8");

    expect(vehicleContent).not.toContain("import { FleetServiceRecord }");
    expect(vehicleContent).toContain("serviceRecord?: any;");
    expect(fs.existsSync(path.join(outPath, "fleetServiceRecord.ts"))).toBe(false);
  });

  it("keeps core user types when include filters are used", () => {
    const vehicleSchema = {
      attributes: {
        vin: { type: "string", required: true },
        owner: {
          type: "relation",
          relation: "manyToOne",
          target: "plugin::users-permissions.user",
        },
      },
    };

    mockFs({
      [path.join(cwd, "src")]: {
        api: {
          vehicle: {
            "schema.json": JSON.stringify(vehicleSchema),
          },
        },
      },
      [path.join(cwd, "genTypes")]: {},
    });

    const strapi = {
      service: jest.fn(),
      log: { info: jest.fn() },
    } as any;

    const service = serviceFactory({ strapi });

    strapi.service.mockImplementation((name: string) => {
      if (name === `plugin::${pluginName}.service`) {
        return service;
      }
      throw new Error(`Unknown service ${name}`);
    });

    const outPath = path.join(cwd, "genTypes");

    service.generateInterfaces(outPath, false, true, ["api::vehicle.*"], []);

    const vehicleFile = path.join(outPath, "vehicle.ts");
    const vehicleContent = fs.readFileSync(vehicleFile, "utf-8");

    expect(vehicleContent).toContain("import { User }");
    expect(vehicleContent).toContain("owner?: User | null;");
  });
});
