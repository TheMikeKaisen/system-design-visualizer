import { JavaSimulationScenario } from "./engine";

const wideningCode = `byte b = 24;
int i = b;`;

const negativeWideningCode = `byte b = -10;
int i = b;`;

const characterWideningCode = `char c = 'A';
int i = c;`;

const arithmeticPromotionCode = `byte b = 50;
int result = b * 2;`;

const explicitNarrowingCode = `int i = 300;
byte b = (byte) i;`;

const negativeNarrowingCode = `int i = -130;
byte b = (byte) i;`;

const truncatingCode = `float f = 15.678f;
int i = (int) f;`;

const precisionLossCode = `double d = 123456789.987654321;
float f = (float) d;`;

const overflowCode = `byte b = 127;
b++;`;

const booleanWallCode = `boolean flag = true;
int i = (int) flag; // Compilation Error`;

const interviewChallengeCode = `byte b = 100;
b = (byte) (b + 28);
System.out.println(b);`;

export const SCENARIO_WIDENING: JavaSimulationScenario = {
  id: "implicit-widening",
  title: "Implicit Widening",
  description: "Visualizing a smaller primitive (byte) fitting safely into a larger primitive (int).",
  steps: [
    {
      id: "w1",
      explanation: "We start with a byte variable 'b' containing the value 24.",
      toastMessage: "byte b = 24",
      code: wideningCode,
      activeLine: 1,
      sourceType: "byte",
      sourceValue: "24",
      sourceBits: "00011000",
      visualEffect: { type: "none" }
    },
    {
      id: "w2",
      explanation: "Java wants to assign this 8-bit byte into a 32-bit int. It sees the destination needs more bits.",
      toastMessage: "Destination is 32 bits",
      code: wideningCode,
      activeLine: 2,
      sourceType: "byte",
      sourceValue: "24",
      sourceBits: "00011000",
      targetType: "int",
      targetBits: "........................00011000", // Using dots to represent empty bits initially
      targetValue: "?",
      visualEffect: { type: "bit-surgery" }
    },
    {
      id: "w3",
      explanation: "Java automatically fills the remaining 24 bits with 0s. No information is lost, 24 is still 24. This is Automatic Widening.",
      toastMessage: "Padding with 0s",
      code: wideningCode,
      activeLine: 2,
      sourceType: "byte",
      sourceValue: "24",
      sourceBits: "00011000",
      targetType: "int",
      targetBits: "00000000000000000000000000011000",
      targetValue: "24",
      visualEffect: { type: "bit-surgery" }
    }
  ]
};

export const SCENARIO_NEG_WIDENING: JavaSimulationScenario = {
  id: "negative-widening",
  title: "Negative Widening",
  description: "What happens when you widen a negative number? Sign Extension.",
  steps: [
    {
      id: "nw1",
      explanation: "We start with a byte variable 'b' containing -10.",
      toastMessage: "byte b = -10",
      code: negativeWideningCode,
      activeLine: 1,
      sourceType: "byte",
      sourceValue: "-10",
      sourceBits: "11110110",
      visualEffect: { type: "none" }
    },
    {
      id: "nw2",
      explanation: "We need to widen this to a 32-bit integer. What should Java place in the new bits? If it places 0s, the number becomes positive! (0000...11110110 = 246)",
      toastMessage: "What fills the empty bits?",
      code: negativeWideningCode,
      activeLine: 2,
      sourceType: "byte",
      sourceValue: "-10",
      sourceBits: "11110110",
      targetType: "int",
      targetBits: "........................11110110",
      targetValue: "?",
      visualEffect: { type: "bit-surgery" }
    },
    {
      id: "nw3",
      explanation: "To keep negative numbers negative, Java copies the sign bit (the leftmost bit, which is 1). This is called Sign Extension.",
      toastMessage: "Sign Extension: Fill with 1s",
      code: negativeWideningCode,
      activeLine: 2,
      sourceType: "byte",
      sourceValue: "-10",
      sourceBits: "11110110",
      targetType: "int",
      targetBits: "11111111111111111111111111110110",
      targetValue: "-10",
      visualEffect: { type: "bit-surgery" }
    }
  ]
};

export const SCENARIO_CHAR_WIDENING: JavaSimulationScenario = {
  id: "character-widening",
  title: "Character Widening",
  description: "char is actually an unsigned 16-bit integer storing Unicode values.",
  steps: [
    {
      id: "cw1",
      explanation: "We have a char 'A'. In Java, a char is an unsigned 16-bit integer.",
      toastMessage: "char c = 'A'",
      code: characterWideningCode,
      activeLine: 1,
      sourceType: "char",
      sourceValue: "'A'",
      sourceBits: "0000000001000001", 
      visualEffect: { type: "unicode-lookup" }
    },
    {
      id: "cw2",
      explanation: "A Unicode lookup translates 'A' to its decimal value: 65.",
      toastMessage: "Unicode 'A' is 65",
      code: characterWideningCode,
      activeLine: 1,
      sourceType: "char",
      sourceValue: "65 ('A')",
      sourceBits: "0000000001000001",
      visualEffect: { type: "unicode-lookup" }
    },
    {
      id: "cw3",
      explanation: "When stored inside an int (32-bit), it is simply widened with 0s since chars are unsigned.",
      toastMessage: "Stored inside int",
      code: characterWideningCode,
      activeLine: 2,
      sourceType: "char",
      sourceValue: "65",
      sourceBits: "0000000001000001",
      targetType: "int",
      targetBits: "00000000000000000000000001000001",
      targetValue: "65",
      visualEffect: { type: "bit-surgery" }
    }
  ]
};

export const SCENARIO_ARITHMETIC: JavaSimulationScenario = {
  id: "arithmetic-promotion",
  title: "Automatic Arithmetic Promotion",
  description: "Why byte, short, and char become int before arithmetic.",
  steps: [
    {
      id: "ap1",
      explanation: "We have a byte 'b' equal to 50.",
      toastMessage: "byte b = 50",
      code: arithmeticPromotionCode,
      activeLine: 1,
      sourceType: "byte",
      sourceValue: "50",
      sourceBits: "00110010",
      visualEffect: { type: "none" }
    },
    {
      id: "ap2",
      explanation: "An arithmetic operation (* 2) is detected. CPUs naturally perform operations on register-sized values (usually 32-bit or 64-bit).",
      toastMessage: "Arithmetic detected",
      code: arithmeticPromotionCode,
      activeLine: 2,
      sourceType: "byte",
      sourceValue: "50",
      sourceBits: "00110010",
      visualEffect: { type: "none" }
    },
    {
      id: "ap3",
      explanation: "Instead of having complex rules for small types, Java's Rule dictates: All byte, short, and char are promoted to int BEFORE arithmetic.",
      toastMessage: "Promoted to 32-bit int",
      code: arithmeticPromotionCode,
      activeLine: 2,
      sourceType: "byte",
      sourceValue: "50",
      sourceBits: "00110010",
      targetType: "int",
      targetBits: "00000000000000000000000000110010",
      targetValue: "50",
      visualEffect: { type: "bit-surgery" }
    },
    {
      id: "ap4",
      explanation: "Now the multiplication happens: 50 * 2 = 100. The result is an int! This is why you cannot directly assign 'b * 2' back to a byte without an explicit cast.",
      toastMessage: "Result is int",
      code: arithmeticPromotionCode,
      activeLine: 2,
      sourceType: "int",
      sourceValue: "100",
      sourceBits: "00000000000000000000000001100100",
      targetType: "int",
      targetBits: "00000000000000000000000001100100",
      targetValue: "100",
      visualEffect: { type: "none" }
    }
  ]
};

export const SCENARIO_NARROWING: JavaSimulationScenario = {
  id: "explicit-narrowing",
  title: "Explicit Narrowing (The 300 to 44 problem)",
  description: "What happens when you force a large number into a small container.",
  steps: [
    {
      id: "n1",
      explanation: "We start with a 32-bit int value of 300.",
      toastMessage: "int i = 300",
      code: explicitNarrowingCode,
      activeLine: 1,
      sourceType: "int",
      sourceValue: "300",
      sourceBits: "00000000000000000000000100101100",
      visualEffect: { type: "none" }
    },
    {
      id: "n2",
      explanation: "We want to cast this into a byte. But a byte only has 8 boxes available. Java asks: Can I keep all 32 bits? No.",
      toastMessage: "Only 8 bits available",
      code: explicitNarrowingCode,
      activeLine: 2,
      sourceType: "int",
      sourceValue: "300",
      sourceBits: "00000000000000000000000100101100",
      targetType: "byte",
      targetBits: "........",
      targetValue: "?",
      visualEffect: { type: "bit-surgery", surgeryDraggable: true }
    },
    {
      id: "n3",
      explanation: "Only the last 8 bits survive. The upper 24 bits are ruthlessly discarded. This leaves us with 00101100.",
      toastMessage: "Discard upper 24 bits",
      code: explicitNarrowingCode,
      activeLine: 2,
      sourceType: "int",
      sourceValue: "300",
      sourceBits: "xxxxxxxxxxxxxxxxxxxxxxxx00101100",
      targetType: "byte",
      targetBits: "00101100",
      targetValue: "44",
      visualEffect: { type: "bit-surgery" }
    },
    {
      id: "n4",
      explanation: "Mathematically, a byte stores 256 values. Java keeps only the 'value mod 256'. 300 - 256 = 44.",
      toastMessage: "300 % 256 = 44",
      code: explicitNarrowingCode,
      activeLine: 2,
      sourceType: "int",
      sourceValue: "300",
      sourceBits: "xxxxxxxxxxxxxxxxxxxxxxxx00101100",
      targetType: "byte",
      targetBits: "00101100",
      targetValue: "44",
      visualEffect: { type: "bit-surgery" }
    }
  ]
};

export const SCENARIO_NEG_NARROWING: JavaSimulationScenario = {
  id: "negative-narrowing",
  title: "Negative Narrowing",
  description: "Narrowing a negative integer.",
  steps: [
    {
      id: "nn1",
      explanation: "We have a 32-bit int with value -130.",
      toastMessage: "int i = -130",
      code: negativeNarrowingCode,
      activeLine: 1,
      sourceType: "int",
      sourceValue: "-130",
      sourceBits: "11111111111111111111111101111110",
      visualEffect: { type: "none" }
    },
    {
      id: "nn2",
      explanation: "We explicitly narrow this to a byte. Only the last 8 bits survive.",
      toastMessage: "Need only last 8 bits",
      code: negativeNarrowingCode,
      activeLine: 2,
      sourceType: "int",
      sourceValue: "-130",
      sourceBits: "xxxxxxxxxxxxxxxxxxxxxxxx01111110",
      targetType: "byte",
      targetBits: "01111110",
      targetValue: "126",
      visualEffect: { type: "bit-surgery" }
    }
  ]
};

export const SCENARIO_TRUNCATION: JavaSimulationScenario = {
  id: "truncating-conversion",
  title: "Truncating Conversion",
  description: "float to int conversion.",
  steps: [
    {
      id: "t1",
      explanation: "We have a float 15.678. We want to convert it to an int.",
      toastMessage: "float f = 15.678f",
      code: truncatingCode,
      activeLine: 1,
      sourceType: "float",
      sourceValue: "15.678",
      visualEffect: { type: "none" }
    },
    {
      id: "t2",
      explanation: "Can int store decimals? No. Everything after the decimal is literally erased. It is NOT rounded.",
      toastMessage: "Erase fractional part",
      code: truncatingCode,
      activeLine: 2,
      sourceType: "float",
      sourceValue: "15.678",
      targetType: "int",
      targetValue: "15",
      visualEffect: { type: "fractional-erasure", erasedFraction: ".678" }
    },
    {
      id: "t3",
      explanation: "Whether it is 15.2 or 15.9, both become 15. The fractional part is completely discarded.",
      toastMessage: "15.9 also becomes 15",
      code: truncatingCode,
      activeLine: 2,
      sourceType: "float",
      sourceValue: "15",
      targetType: "int",
      targetValue: "15",
      visualEffect: { type: "none" }
    }
  ]
};

export const SCENARIO_PRECISION_LOSS: JavaSimulationScenario = {
  id: "precision-loss",
  title: "Loss of Precision",
  description: "double to float precision reduction.",
  steps: [
    {
      id: "pl1",
      explanation: "A double has 52 precision bits, allowing very large/accurate decimals.",
      toastMessage: "double d = 123456789.987654321",
      code: precisionLossCode,
      activeLine: 1,
      sourceType: "double",
      sourceValue: "123456789.987654321",
      visualEffect: { type: "none" }
    },
    {
      id: "pl2",
      explanation: "Casting to a float restricts us to 23 precision bits. Some digits at the end simply disappear.",
      toastMessage: "Digits disappear",
      code: precisionLossCode,
      activeLine: 2,
      sourceType: "double",
      sourceValue: "123456789.987654321",
      targetType: "float",
      targetValue: "123456792.0",
      visualEffect: { type: "precision-loss" }
    }
  ]
};

export const SCENARIO_OVERFLOW: JavaSimulationScenario = {
  id: "overflow",
  title: "Overflow",
  description: "Adding to the maximum value of a type.",
  steps: [
    {
      id: "o1",
      explanation: "We start with byte b = 127. This is the maximum positive value a signed 8-bit byte can hold (01111111).",
      toastMessage: "byte b = 127",
      code: overflowCode,
      activeLine: 1,
      sourceType: "byte",
      sourceValue: "127",
      sourceBits: "01111111",
      visualEffect: { type: "none" }
    },
    {
      id: "o2",
      explanation: "We increment b. 127 + 1 = 128. But a byte cannot store 128! It wraps around like a mechanical odometer.",
      toastMessage: "Wrap around!",
      code: overflowCode,
      activeLine: 2,
      sourceType: "byte",
      sourceValue: "-128",
      sourceBits: "10000000",
      visualEffect: { type: "odometer", odometerValues: [125, 126, 127, -128, -127] }
    }
  ]
};

export const SCENARIO_BOOLEAN: JavaSimulationScenario = {
  id: "boolean",
  title: "Boolean Wall",
  description: "Attempting to cast a boolean.",
  steps: [
    {
      id: "bw1",
      explanation: "We have a boolean flag set to true.",
      toastMessage: "boolean flag = true",
      code: booleanWallCode,
      activeLine: 1,
      sourceType: "boolean",
      sourceValue: "true",
      visualEffect: { type: "none" }
    },
    {
      id: "bw2",
      explanation: "We attempt to cast it to an int. The Java Compiler checks its Rule Book and hits a Red Wall. No conversion exists for booleans in Java.",
      toastMessage: "Compilation Error",
      code: booleanWallCode,
      activeLine: 2,
      sourceType: "boolean",
      sourceValue: "true",
      targetType: "int",
      targetValue: "Error",
      visualEffect: { type: "red-wall", blockedReason: "Incompatible types: boolean cannot be converted to int" }
    }
  ]
};

export const ALL_TYPECASTING_SCENARIOS = [
  SCENARIO_WIDENING,
  SCENARIO_NEG_WIDENING,
  SCENARIO_CHAR_WIDENING,
  SCENARIO_ARITHMETIC,
  SCENARIO_NARROWING,
  SCENARIO_NEG_NARROWING,
  SCENARIO_TRUNCATION,
  SCENARIO_OVERFLOW,
  SCENARIO_BOOLEAN
];
