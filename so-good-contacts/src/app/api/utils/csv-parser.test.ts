import { parseCSV } from "./csv-parser";

describe("CSV Parser", () => {
	const headers = ["first_name", "last_name", "email"];

	test("should parse valid CSV data correctly", () => {
		// Arrange
		const csvData = "first_name,last_name,email\nJohn,Doe,john@example.com\nJane,Smith,jane@example.com";

		// Act
		const result = parseCSV(csvData, headers);

		// Assert
		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({
			first_name: "John",
			last_name: "Doe",
			email: "john@example.com",
		});
		expect(result[1]).toEqual({
			first_name: "Jane",
			last_name: "Smith",
			email: "jane@example.com",
		});
	});

	test("should throw error when CSV has incorrect number of headers", () => {
		// Arrange
		const csvData = "first_name,last_name\nJohn,Doe";

		// Act & Assert
		expect(() => parseCSV(csvData, headers)).toThrow("Invalid CSV file");
	});

	test("should throw error when CSV has incorrect header names", () => {
		// Arrange
		const csvData = "first_name,surname,email\nJohn,Doe,john@example.com";

		// Act & Assert
		expect(() => parseCSV(csvData, headers)).toThrow("Invalid CSV file");
	});

	test("should handle empty CSV data", () => {
		// Arrange
		const csvData = "first_name,last_name,email\n";

		// Act
		const result = parseCSV(csvData, headers);

		// Assert
		expect(result).toHaveLength(0);
	});

	test("should skip empty lines", () => {
		// Arrange
		const csvData = "first_name,last_name,email\nJohn,Doe,john@example.com\n\nJane,Smith,jane@example.com";

		// Act
		const result = parseCSV(csvData, headers);

		// Assert
		expect(result).toHaveLength(2);
	});

	test("should handle CSV with quoted values", () => {
		// Arrange
		const csvData = 'first_name,last_name,email\n"John","Doe","john@example.com"\n"Jane","Smith","jane@example.com"';

		// Act
		const result = parseCSV(csvData, headers);

		// Assert
		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({
			first_name: "John",
			last_name: "Doe",
			email: "john@example.com",
		});
	});

	test("should handle CSV with values containing commas", () => {
		// Arrange
		const csvData = 'first_name,last_name,email\n"John, Jr.","Doe","john@example.com"\nJane,Smith,jane@example.com';

		// Act
		const result = parseCSV(csvData, headers);

		// Assert
		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({
			first_name: "John, Jr.",
			last_name: "Doe",
			email: "john@example.com",
		});
	});
});
