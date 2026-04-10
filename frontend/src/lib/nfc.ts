import z from "zod";

const PLANTAIN_PAN_PREFIX = "96433078";

export function verifyLuhn(pan: string): boolean {
  let sum = 0;
  let shouldDouble = false;

  // Process the number from right to left
  for (let i = pan.length - 1; i >= 0; i--) {
    let digit = parseInt(pan.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

export function convertPlantainPANToUID(rawPan: string): string {
  const pan = rawPan.replace(/\s/g, '');

  // Remove prefix and check digit (last digit)
  const numStr = pan.slice(PLANTAIN_PAN_PREFIX.length, -1);
  const num = parseInt(numStr, 10);

  // Convert number back to UID bytes
  const uid: number[] = [];
  let remaining = num;

  // Extract first 7 bytes (56 bits) from the number
  for (let i = 0; i < 7; i++) {
    uid.push(remaining & 0xFF);
    remaining = Math.floor(remaining / 256);
  }

  // Convert to hex
  return uid.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('');
}


export const PlantainPANSchema = z
  .string()
  .superRefine((str, ctx) => {
    const pan = str.replace(/\s/g, '');

    // Check PAN prefix
    if (!pan.startsWith(PLANTAIN_PAN_PREFIX)) {
      return ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Podorozhnik Number must start with 9643 3078',
        fatal: true,
      })
    }

    // Supports only 7-byte UIDs / 26-digit PAN
    if (pan.length !== 26) {
      return ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Podorozhnik Number must be 26 digits long',
        fatal: true,
      });
    }

    // Verify check digit using Luhn algorithm
    if (!verifyLuhn(pan)) {
      return ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Podorozhnik Number appears to be incorrect',
        fatal: true,
      });
    }
  });