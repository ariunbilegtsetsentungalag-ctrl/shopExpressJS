# Profile Completion Feature

## Overview
Users must complete their profile before they can add items to cart or make purchases. This ensures that all necessary delivery and contact information is collected.

## Required Profile Fields

Users must fill in the following fields to complete their profile:

### Personal Information
- **First Name** *
- **Last Name** *
- **Phone Number** *
- Date of Birth (optional)
- Gender (optional)

### Address Information
- **Street Address** *
- **City** *
- **State/Province** *
- **Zip Code** *
- **Country** *

Fields marked with * are required for profile completion.

## How It Works

### 1. User Registration
- Users sign up with username, email, and password
- Profile is automatically marked as incomplete
- Users can browse products but cannot add to cart

### 2. Profile Completion
- When users try to add items to cart without completing their profile, they are redirected to the profile page
- A warning alert is shown indicating required fields
- All required fields are marked with a red asterisk (*)
- After filling all required fields and saving, the profile is marked as complete

### 3. Shopping Access
- Once profile is complete, users can:
  - Add items to cart
  - Update cart items
  - Remove cart items
  - Checkout and place orders

### 4. Profile Updates
- Users can update their profile at any time
- All required fields must remain filled
- If a required field is removed, profile becomes incomplete again

## Database Schema

### User Model Updates
```javascript
{
  // ... existing fields
  profileCompleted: {
    type: Boolean,
    default: false
  }
}
```

### Methods
- `isProfileComplete()`: Checks if all required fields are filled
- Pre-save hook automatically updates `profileCompleted` status

## Implementation Details

### Files Modified

1. **models/User.js**
   - Added `profileCompleted` field
   - Added `isProfileComplete()` method
   - Added pre-save hook to auto-update completion status

2. **middleware/auth.js**
   - Added `requireCompleteProfile` middleware
   - Checks profile completion before allowing cart operations
   - Redirects to profile page with original URL for redirect after completion

3. **controllers/userController.js**
   - Updated `getProfile` to handle redirect parameter
   - Updated `updateProfile` to validate all required fields
   - Automatic redirect after profile completion

4. **views/profile.ejs**
   - Added warning alert for incomplete profiles
   - Marked all required fields with asterisk
   - Added form validation
   - Handles redirect after completion

5. **app.js**
   - Added `requireCompleteProfile` middleware to cart routes:
     - `/cart` (view cart)
     - `/cart/add` (add to cart)
     - `/cart/update` (update cart)
     - `/cart/remove/:id` (remove from cart)
     - `/cart/checkout` (checkout)

### Scripts

#### Migration Script
Run this script to update profile completion status for existing users:

```bash
npm run migrate-profiles
```

This script:
- Connects to the database
- Checks all existing users
- Updates their `profileCompleted` status based on current profile data
- Displays results

## User Flow Example

### New User Registration
1. User signs up → Profile incomplete
2. User browses shop → Can view products
3. User clicks "Add to Cart" → Redirected to profile page with warning
4. User fills required fields → Saves profile
5. User redirected back to product page
6. User clicks "Add to Cart" → Successfully added
7. User can now checkout

### Existing User with Incomplete Profile
1. User logs in → Profile incomplete
2. User tries to checkout → Redirected to profile page
3. User completes missing fields → Saves
4. User redirected back to cart
5. User can now complete checkout

## Testing

### Test Cases
1. **New User Registration**
   - Sign up with username, email, password
   - Verify profile is marked incomplete
   - Try to add item to cart → Should redirect to profile

2. **Profile Completion**
   - Fill all required fields
   - Save profile
   - Verify success message
   - Try to add item to cart → Should succeed

3. **Incomplete Profile Update**
   - Clear a required field
   - Save profile → Should show error
   - Profile should remain incomplete

4. **Complete Profile Shopping**
   - Complete profile
   - Add items to cart
   - Update quantities
   - Checkout successfully

## Security Notes

- Email field is read-only on profile update (cannot be changed for security)
- All inputs are validated and sanitized
- Required fields are checked both client-side and server-side
- MongoDB transactions ensure data consistency

## Admin Users

Admins and product managers can:
- Skip profile completion requirement for administrative tasks
- Manage products without completing profile
- View analytics without profile completion

Regular shopping features still require profile completion even for admin users.

## Future Enhancements

Possible improvements:
- Email verification before profile completion
- Phone number verification via OTP
- Address validation using external API
- Profile completion progress indicator
- Partial profile save (draft mode)
- Reminder emails for incomplete profiles
