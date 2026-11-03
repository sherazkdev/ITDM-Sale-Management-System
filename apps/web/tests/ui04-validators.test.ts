import { describe, expect, it } from "vitest";
import { createEmployeeSchema, updateEmployeeSchema } from "../src/lib/validators/employee";
import { createVendorSchema } from "../src/lib/validators/vendor";
import {
  createAssetCategorySchema,
  registerAssetSchema,
  updateAssetMetadataSchema,
} from "../src/lib/validators/asset";

describe("createEmployeeSchema", () => {
  it("accepts valid employee input", () => {
    const result = createEmployeeSchema.safeParse({
      employeeNumber: "E-100",
      fullName: "Jane Doe",
      email: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing employee number", () => {
    const result = createEmployeeSchema.safeParse({
      employeeNumber: "",
      fullName: "Jane Doe",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = createEmployeeSchema.safeParse({
      employeeNumber: "E-1",
      fullName: "Jane",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateEmployeeSchema", () => {
  it("allows partial updates", () => {
    const result = updateEmployeeSchema.safeParse({ department: "IT" });
    expect(result.success).toBe(true);
  });
});

describe("createVendorSchema", () => {
  it("requires vendor name", () => {
    expect(createVendorSchema.safeParse({ vendorName: "Acme" }).success).toBe(true);
    expect(createVendorSchema.safeParse({ vendorName: "" }).success).toBe(false);
  });
});

describe("registerAssetSchema", () => {
  it("requires code, name, and category", () => {
    const ok = registerAssetSchema.safeParse({
      assetCode: "LT-001",
      assetName: "Laptop",
      categoryId: "1",
    });
    expect(ok.success).toBe(true);

    const bad = registerAssetSchema.safeParse({
      assetCode: "",
      assetName: "Laptop",
      categoryId: "1",
    });
    expect(bad.success).toBe(false);
  });

  it("validates purchase date format", () => {
    const result = registerAssetSchema.safeParse({
      assetCode: "LT-001",
      assetName: "Laptop",
      categoryId: "1",
      purchaseDate: "15/03/2026",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateAssetMetadataSchema", () => {
  it("requires at least one field change", () => {
    expect(updateAssetMetadataSchema.safeParse({}).success).toBe(false);
    expect(updateAssetMetadataSchema.safeParse({ assetName: "Updated" }).success).toBe(true);
  });
});

describe("createAssetCategorySchema", () => {
  it("requires category name", () => {
    expect(createAssetCategorySchema.safeParse({ categoryName: "Laptops" }).success).toBe(true);
    expect(createAssetCategorySchema.safeParse({ categoryName: "" }).success).toBe(false);
  });
});
