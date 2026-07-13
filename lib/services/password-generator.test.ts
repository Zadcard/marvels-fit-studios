import { describe, it, expect, beforeEach } from "vitest";
import { PasswordGenerator } from "@/lib/services/password-generator";

describe("PasswordGenerator", () => {
  let generator: PasswordGenerator;

  beforeEach(() => {
    generator = new PasswordGenerator();
  });

  describe("generatePassword", () => {
    it("should generate password in format MFS_YYMMXXX", () => {
      const password = generator.generatePassword("2605020");
      expect(password).toBe("MFS_2605020");
    });

    it("should throw error for invalid client ID format (too short)", () => {
      expect(() => generator.generatePassword("260502")).toThrow(
        "Invalid client ID format"
      );
    });

    it("should throw error for invalid client ID format (too long)", () => {
      expect(() => generator.generatePassword("26050200")).toThrow(
        "Invalid client ID format"
      );
    });

    it("should throw error for non-numeric client ID", () => {
      expect(() => generator.generatePassword("26050AB")).toThrow(
        "Invalid client ID format"
      );
    });

    it("should throw error for empty string", () => {
      expect(() => generator.generatePassword("")).toThrow(
        "Invalid client ID format"
      );
    });

    it("should handle different valid client IDs", () => {
      expect(generator.generatePassword("2601001")).toBe("MFS_2601001");
      expect(generator.generatePassword("2612999")).toBe("MFS_2612999");
      expect(generator.generatePassword("2605500")).toBe("MFS_2605500");
    });

    it("should prefix with MFS_", () => {
      const password = generator.generatePassword("2605020");
      expect(password.startsWith("MFS_")).toBe(true);
    });

    it("should be 11 characters long (MFS_ + 7 digits)", () => {
      const password = generator.generatePassword("2605020");
      expect(password).toHaveLength(11);
    });

    it("should contain only alphanumeric and underscore", () => {
      const password = generator.generatePassword("2605020");
      expect(password).toMatch(/^[A-Z0-9_]+$/);
    });

    it("should preserve client ID digits exactly", () => {
      const clientId = "2605020";
      const password = generator.generatePassword(clientId);
      expect(password.substring(4)).toBe(clientId);
    });
  });

  describe("isValidFormat", () => {
    it("should return true for valid password format", () => {
      expect(generator.isValidFormat("MFS_2605020")).toBe(true);
    });

    it("should return true for different valid passwords", () => {
      expect(generator.isValidFormat("MFS_2601001")).toBe(true);
      expect(generator.isValidFormat("MFS_2612999")).toBe(true);
      expect(generator.isValidFormat("MFS_2605500")).toBe(true);
    });

    it("should return false for missing prefix", () => {
      expect(generator.isValidFormat("2605020")).toBe(false);
    });

    it("should return false for wrong prefix", () => {
      expect(generator.isValidFormat("MFF_2605020")).toBe(false);
    });

    it("should return false for missing underscore", () => {
      expect(generator.isValidFormat("MFS2605020")).toBe(false);
    });

    it("should return false for lowercase", () => {
      expect(generator.isValidFormat("mfs_2605020")).toBe(false);
    });

    it("should return false for too short client ID", () => {
      expect(generator.isValidFormat("MFS_260502")).toBe(false);
    });

    it("should return false for too long client ID", () => {
      expect(generator.isValidFormat("MFS_26050200")).toBe(false);
    });

    it("should return false for non-numeric client ID", () => {
      expect(generator.isValidFormat("MFS_2605ABC")).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(generator.isValidFormat("")).toBe(false);
    });

    it("should return false for only prefix", () => {
      expect(generator.isValidFormat("MFS_")).toBe(false);
    });

    it("should return false with extra spaces", () => {
      expect(generator.isValidFormat("MFS_ 2605020")).toBe(false);
    });

    it("should return false with trailing characters", () => {
      expect(generator.isValidFormat("MFS_2605020X")).toBe(false);
    });
  });

  describe("extractClientId", () => {
    it("should extract client ID from valid password", () => {
      const clientId = generator.extractClientId("MFS_2605020");
      expect(clientId).toBe("2605020");
    });

    it("should extract from different valid passwords", () => {
      expect(generator.extractClientId("MFS_2601001")).toBe("2601001");
      expect(generator.extractClientId("MFS_2612999")).toBe("2612999");
      expect(generator.extractClientId("MFS_2605500")).toBe("2605500");
    });

    it("should return null for invalid format", () => {
      expect(generator.extractClientId("2605020")).toBeNull();
    });

    it("should return null for wrong prefix", () => {
      expect(generator.extractClientId("MFF_2605020")).toBeNull();
    });

    it("should return null for missing underscore", () => {
      expect(generator.extractClientId("MFS2605020")).toBeNull();
    });

    it("should return null for lowercase", () => {
      expect(generator.extractClientId("mfs_2605020")).toBeNull();
    });

    it("should return null for empty string", () => {
      expect(generator.extractClientId("")).toBeNull();
    });

    it("should return null for only prefix", () => {
      expect(generator.extractClientId("MFS_")).toBeNull();
    });

    it("should return null for non-numeric client ID", () => {
      expect(generator.extractClientId("MFS_2605ABC")).toBeNull();
    });

    it("should return null for too short client ID", () => {
      expect(generator.extractClientId("MFS_260502")).toBeNull();
    });

    it("should return null for too long client ID", () => {
      expect(generator.extractClientId("MFS_26050200")).toBeNull();
    });

    it("should return null with trailing characters", () => {
      expect(generator.extractClientId("MFS_2605020X")).toBeNull();
    });

    it("should return null with extra spaces", () => {
      expect(generator.extractClientId("MFS_ 2605020")).toBeNull();
    });
  });

  describe("generate and validate roundtrip", () => {
    it("should validate generated passwords", () => {
      const password = generator.generatePassword("2605020");
      expect(generator.isValidFormat(password)).toBe(true);
    });

    it("should extract client ID from generated password", () => {
      const clientId = "2605020";
      const password = generator.generatePassword(clientId);
      const extracted = generator.extractClientId(password);
      expect(extracted).toBe(clientId);
    });

    it("should work for multiple client IDs", () => {
      const clientIds = ["2601001", "2605020", "2612999"];
      for (const clientId of clientIds) {
        const password = generator.generatePassword(clientId);
        expect(generator.isValidFormat(password)).toBe(true);
        expect(generator.extractClientId(password)).toBe(clientId);
      }
    });
  });
});
