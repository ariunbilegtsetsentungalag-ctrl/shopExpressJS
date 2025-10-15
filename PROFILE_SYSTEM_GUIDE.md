# Profile Model Implementation Guide

## Overview

This document describes the implementation of a dedicated Profile model to create a cleaner, more organized database structure for user profile data. The Profile system separates user authentication data from profile information, providing better data organization and more sophisticated profile management capabilities.

## Architecture

### Database Structure

#### User Model (Simplified)
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String (hashed),
  role: String,
  permissions: [String],
  profile: ObjectId (ref: 'Profile'),
  isActive: Boolean,
  isVerified: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### Profile Model (Comprehensive)
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User'),
  
  personalInfo: {
    firstName: String,
    lastName: String,
    phone: String,
    dateOfBirth: Date,
    gender: String,
    avatar: String
  },
  
  address: {
    aimag: String (Mongolian provinces/city),
    duuregSum: String (Districts for UB / Sums for aimags),
    horoo: String (Sub-districts for UB),
    detailedAddress: String,
    zipCode: String
  },
  
  preferences: {
    language: String,
    currency: String,
    notifications: {
      email: Boolean,
      sms: Boolean,
      promotions: Boolean
    }
  },
  
  completionStatus: {
    isComplete: Boolean,
    completedSections: {
      personalInfo: Boolean,
      address: Boolean,
      preferences: Boolean
    },
    completionPercentage: Number (0-100)
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

## Key Features

### 1. Automatic Profile Creation
- Profiles are created automatically when users access their profile page
- Uses the `findOrCreateByUserId` static method for seamless profile initialization

### 2. Intelligent Completion Tracking
- Automatic calculation of profile completion percentage
- Section-based completion tracking (personal info, address, preferences)
- Smart validation based on Mongolian addressing system

### 3. Mongolian Address Integration
- Full integration with the comprehensive Mongolian address system
- Supports both Ulaanbaatar (district/horoo) and aimag (sum) structures
- Validates horoo requirement only for Ulaanbaatar districts

### 4. User Experience Enhancement
- Real-time completion percentage display
- Visual indicators for incomplete profiles
- Cascading address selection with proper Mongolian geographic hierarchy

## Implementation Details

### Profile Model Methods

#### Instance Methods
```javascript
// Check if personal information is complete
profile.checkPersonalInfoComplete()

// Check if address is complete (with Mongolian logic)
profile.checkAddressComplete()

// Check if preferences are complete
profile.checkPreferencesComplete()

// Calculate overall completion percentage
profile.calculateCompletionPercentage()
```

#### Static Methods
```javascript
// Find or create profile by user ID
Profile.findOrCreateByUserId(userId)
```

### Controller Integration

#### User Controller Updates
```javascript
// Get profile with automatic creation
exports.getProfile = async (req, res) => {
  const user = await User.findById(userId).populate('profile');
  
  if (!user.profile) {
    const profile = await Profile.findOrCreateByUserId(userId);
    user.profile = profile._id;
    await user.save();
  }
  // ... rest of implementation
}

// Update profile with new structure
exports.updateProfile = async (req, res) => {
  let profile = await Profile.findOrCreateByUserId(userId);
  
  profile.personalInfo = { /* updated data */ };
  profile.address = { /* updated address */ };
  
  await profile.save(); // Triggers completion calculation
  // ... rest of implementation
}
```

### View Integration

#### Template Updates
The profile view has been updated to use the new Profile model structure:

```html
<!-- Profile completion indicator -->
<% if (profile && !profile.completionStatus.isComplete) { %>
  <div class="alert alert-warning">
    Complete your profile (<%= profile.completionStatus.completionPercentage %>% complete)
  </div>
<% } %>

<!-- Form fields using Profile model -->
<input type="text" name="firstName" 
       value="<%= profile && profile.personalInfo.firstName || '' %>">

<input type="text" name="aimag" 
       value="<%= profile && profile.address.aimag || '' %>">
```

## Migration System

### Automatic Data Migration
The migration script (`scripts/migrateUserProfiles.js`) handles:

1. **Data Transfer**: Moves existing profile data from User model to Profile model
2. **Reference Creation**: Links users to their new profiles
3. **Cleanup**: Optionally removes old profile fields from User model
4. **Validation**: Ensures data integrity during migration

### Migration Features
- Automatic detection of existing profile data
- Skip already migrated profiles
- Comprehensive error handling and reporting
- Detailed migration summary

## Benefits

### 1. Database Organization
- **Separation of Concerns**: Authentication vs. profile data
- **Scalability**: Easier to add new profile features
- **Performance**: More efficient queries for specific data types

### 2. Enhanced Functionality
- **Sophisticated Validation**: Context-aware profile completion
- **Better User Experience**: Progressive profile completion tracking
- **Extensibility**: Easy to add new profile sections

### 3. Maintenance Benefits
- **Cleaner Code**: Better organized model structure
- **Easier Updates**: Profile changes don't affect authentication
- **Better Testing**: Isolated profile logic

## API Endpoints

### Profile Management
- `GET /profile` - View user profile (with auto-creation)
- `POST /profile` - Update user profile
- `GET /api/aimags` - Get Mongolian aimags
- `GET /api/districts-sums/:aimag` - Get districts or sums
- `GET /api/horoos/:aimag/:district` - Get horoos for districts

## Configuration

### Environment Variables
No additional environment variables required. The Profile system uses the existing MongoDB connection.

### Dependencies
- MongoDB/Mongoose (existing)
- Express.js (existing)
- No new dependencies added

## Best Practices

### 1. Profile Creation
Always use the `findOrCreateByUserId` method to ensure profiles exist:

```javascript
const profile = await Profile.findOrCreateByUserId(userId);
```

### 2. Validation
Leverage the automatic completion checking:

```javascript
// Profile completion is calculated automatically on save
await profile.save(); // Triggers pre-save hooks
```

### 3. Population
Always populate profile when fetching users who need profile data:

```javascript
const user = await User.findById(userId).populate('profile');
```

## Future Enhancements

### Potential Additions
1. **Profile Photos**: Enhanced avatar management system
2. **Social Profiles**: Integration with social media profiles
3. **Privacy Settings**: Granular privacy control for profile sections
4. **Profile History**: Track profile changes over time
5. **Profile Verification**: Email/phone verification status

### Extensibility
The Profile model is designed to be easily extensible:
- Add new sections to the schema
- Implement additional completion criteria
- Enhance validation rules
- Add new preference categories

## Troubleshooting

### Common Issues

1. **Profile Not Found**: Ensure `findOrCreateByUserId` is used
2. **Completion Not Updating**: Check that `profile.save()` is called
3. **Address Validation Failing**: Verify Mongolian address data structure

### Debugging Tips

1. **Check Profile Link**: Verify `user.profile` references correct Profile document
2. **Validation Errors**: Review Profile model validation rules
3. **Migration Issues**: Run migration script with logging enabled

## Conclusion

The Profile model implementation provides a robust, scalable foundation for user profile management in the e-commerce application. It maintains backward compatibility while offering enhanced functionality and better data organization for future development.