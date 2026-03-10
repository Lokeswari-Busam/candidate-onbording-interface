# Quick Start - Apply Pattern to Next Page

## 🚀 Fast Implementation (15-20 minutes)

### Example: Address Details Page

#### Step 1: Copy Required Imports
```typescript
import { FormField, TextInput, SelectInput } from "@/app/components/onboarding/FormComponents";
import { Button } from "@/app/components/onboarding/ButtonComponents";
import { ErrorAlert } from "@/app/components/onboarding/AlertsComponents";
import { validations, errorMessages } from "@/app/utils/validations";
```

#### Step 2: Add Validation State (After existing state declarations)
```typescript
// Add this near other useState calls
const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
```

#### Step 3: Create Validation Function (Before handleContinue)
```typescript
const validateAddressFields = (address: AddressForm): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!address.address_line1?.trim()) {
    errors.address_line1 = errorMessages.REQUIRED;
  }

  if (!address.city?.trim()) {
    errors.city = errorMessages.REQUIRED;
  } else if (!/^[A-Za-z\s\-'.]+$/.test(address.city)) {
    errors.city = "City must contain only letters";
  }

  if (!address.postal_code?.trim()) {
    errors.postal_code = errorMessages.REQUIRED;
  } else if (!validations.isValidPostalCode(address.postal_code)) {
    errors.postal_code = errorMessages.INVALID_POSTAL_CODE;
  }

  if (!address.country_uuid) {
    errors.country_uuid = errorMessages.REQUIRED;
  }

  return errors;
};
```

#### Step 4: Update handleContinue to Use Validation
```typescript
const handleContinue = async () => {
  if (isSubmittingRef.current) return;

  // Validate BOTH addresses
  const permanentErrors = validateAddressFields(permanent);
  const currentErrors = !sameAsPermanent ? validateAddressFields(current) : {};

  // Combine errors
  const allErrors = { ...permanentErrors, ...currentErrors };

  if (Object.keys(allErrors).length > 0) {
    setFieldErrors(allErrors);
    toast.error("Please fix all errors before continuing");
    setGlobalLoading(false);
    return;
  }

  // Clear errors and proceed with original logic
  setFieldErrors({});
  // ... rest of existing handleContinue code
};
```

#### Step 5: Add Field Change Handler
```typescript
const handleFieldChange = (
  section: "permanent" | "current",
  fieldName: string,
  value: string
) => {
  // Update form data
  setDraft((prev) => ({
    ...prev,
    [section]: {
      ...prev[section],
      [fieldName]: value,
    },
  }));

  // Clear error for this field
  if (fieldErrors[`${section}_${fieldName}`]) {
    setFieldErrors((prev) => ({
      ...prev,
      [`${section}_${fieldName}`]: "",
    }));
  }
};
```

#### Step 6: Replace UI (Example for Permanent Address)
```typescript
// OLD CODE - Remove this section:
<label style={labelStyle}>Address Line 1</label>
<input
  value={permanent.address_line1}
  onChange={(e) => setDraft(prev => ({ ...prev, permanent: { ...prev.permanent, address_line1: e.target.value }}))}
  style={inputStyle}
/>

// NEW CODE - Replace with:
<FormField
  label="Address Line 1"
  required
  error={fieldErrors.permanent_address_line1}
>
  <TextInput
    name="address_line1"
    value={permanent.address_line1}
    onChange={(e) => handleFieldChange("permanent", "address_line1", e.target.value)}
    placeholder="Street address"
    error={fieldErrors.permanent_address_line1 ? "true" : ""}
  />
</FormField>
```

#### Step 7: Update Return/Render (Entire UI replacement)
```typescript
// OLD - Delete all inline style definitions
const pageWrapper = { ... };
const cardStyle = { ... };
// etc.

// NEW - Replace entire return with:
return (
  <div className="min-h-screen bg-slate-100 py-10">
    <div className="mx-auto max-w-2xl rounded-xl bg-white p-8 shadow-lg">
      <h2 className="mb-8 text-2xl font-bold text-slate-900">
        Address Details
      </h2>

      {error && <ErrorAlert message={error} onClose={() => setError("")} />}

      <div className="space-y-8">
        {/* Permanent Address Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-slate-900">
            Permanent Address
          </h3>

          <FormField
            label="Address Line 1"
            required
            error={fieldErrors.permanent_address_line1}
          >
            <TextInput
              name="address_line1"
              value={permanent.address_line1}
              onChange={(e) =>
                handleFieldChange("permanent", "address_line1", e.target.value)
              }
              placeholder="Street address"
            />
          </FormField>

          {/* Add more fields following same pattern */}
        </div>

        {/* Current Address Section (if not same as permanent) */}
        <div className="border-t pt-8 space-y-6">
          <div className="flex items-center gap-2">
            <CheckboxInput
              type="checkbox"
              label="Same as Permanent Address"
              checked={sameAsPermanent}
              onChange={(e) => handleSameAsPermanent(e.target.checked)}
            />
          </div>

          {!sameAsPermanent && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900">
                Current Address
              </h3>
              {/* Add current address fields following same pattern */}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button
            variant="secondary"
            onClick={() => router.back()}
          >
            Back
          </Button>
          <Button
            variant="primary"
            onClick={handleContinue}
            loading={false}
          >
            Save & Continue
          </Button>
        </div>
      </div>
    </div>
  </div>
);
```

## ✅ Checklist for Each Page Update

- [ ] Add FormComponents imports
- [ ] Add error state (fieldErrors)
- [ ] Create validation function(s)
- [ ] Add/update change handlers to clear errors
- [ ] Update submit handler with validation
- [ ] Replace all form fields with new components
- [ ] Delete all inline style definitions
- [ ] Update return statement with Tailwind layout
- [ ] Add section titles where appropriate
- [ ] Test field validation works
- [ ] Test error messages display correctly
- [ ] Test errors clear when field is corrected
- [ ] Test cannot submit with errors
- [ ] Check responsive design
- [ ] Verify all existing functionality still works

## Common Field Validation Patterns

### Required Text Field
```typescript
if (!value?.trim()) {
  errors.fieldName = errorMessages.REQUIRED;
}
```

### Email Field
```typescript
if (!validations.isValidEmail(value)) {
  errors.email = errorMessages.INVALID_EMAIL;
}
```

### Phone Field
```typescript
if (!validations.isValidPhone(value)) {
  errors.phone = errorMessages.INVALID_PHONE;
}
```

### Postal Code (6 digits)
```typescript
if (!validations.isValidPostalCode(value)) {
  errors.postal_code = errorMessages.INVALID_POSTAL_CODE;
}
```

### Dropdown/Select (Required)
```typescript
if (!value) {
  errors.selectField = errorMessages.REQUIRED;
}
```

### File Upload (Type & Size)
```typescript
if (file) {
  if (!validations.isValidFileType(file.name, ["pdf", "jpg", "png"])) {
    errors.document = errorMessages.INVALID_FILE_TYPE(["PDF", "JPG", "PNG"]);
  }
  if (!validations.isValidFileSize(file.size, 5)) {
    errors.document = errorMessages.INVALID_FILE_SIZE(5);
  }
}
```

## Keyboard Shortcuts

While implementing, remember:
- `Ctrl/Cmd + H` - Find & Replace helpful for changing style references
- Work section by section
- Test each section before moving to next

## Common Mistakes to Avoid

❌ **Don't:**
- Remove error clearing in onChange
- Forget to add `required` prop to FormField
- Use inline `style={}` props instead of `className=`
- Mix old and new components in same form

✅ **Do:**
- Clear errors when user corrects field
- Set `error={fieldErrors.fieldName}` on FormField
- Use Tailwind classes exclusively for styling
- Complete all fields consistently

## File Structure After Updates

```
app/onboarding/[token]/
├── address-details/
│   └── page.tsx  ← Uses new components
├── identity-documents/
│   └── page.tsx  ← Uses new components
├── personal-details/
│   └── page.tsx  ← ✅ DONE
├── education-details/
│   └── page.tsx  ← Uses new components
├── experience-details/
│   └── page.tsx  ← Uses new components
├── preview-page/
│   └── page.tsx  ← Minimal changes
└── success/
    └── page.tsx  ← Minimal changes

app/components/onboarding/
├── FormComponents.tsx      ← ✅ NEW
├── AlertsComponents.tsx    ← ✅ NEW
├── ButtonComponents.tsx    ← ✅ NEW
├── OnboardingHeader.tsx    ← (existing)
└── steps.js               ← (existing)

app/utils/
├── validations.ts          ← ✅ NEW
└── (other utils)

app/hooks/
├── useFormValidation.ts    ← ✅ NEW
├── localStorage.ts         ← (existing)
└── (other hooks)
```

## Time Estimate per Page

- **Address Details**: 15-20 min
- **Identity Documents**: 15-20 min
- **Education Details**: 10-15 min (already has structure)
- **Experience Details**: 15-20 min
- **Preview Page**: 5-10 min
- **Success Page**: 5-10 min

**Total: 60-90 minutes** to complete all pages

Good luck! You've got this! 🚀
