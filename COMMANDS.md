# Discord Bot Commands - Complete List

## Overview
This bot now includes **65+ commands** for comprehensive key and status management, organized into logical categories.

## 🔑 Key Management Commands (12 commands)
- `/generatekey` - Generate a new key for a user
- `/revokekey` - Revoke a user's key
- `/extendkey` - Extend key duration
- `/upgradekey` - Upgrade key type
- `/getkey` - Get user's key
- `/checkkey` - Check key status
- `/listkeys` - List all active keys
- `/expirekey` - Manually expire a key
- `/suspendkey` - Temporarily suspend a key
- `/reactivatekey` - Reactivate suspended key
- `/transferkey` - Transfer key to another user
- `/duplicatekey` - Duplicate key for another user

## 📊 Status & Information Commands (10 commands)
- `/userstatus` - Check complete user status
- `/keyinfo` - Detailed key information
- `/banstatus` - Check ban status
- `/ratelimitstatus` - Check rate limit status
- `/activestatus` - Check activity status
- `/subscriptionstatus` - Check subscription status
- `/usagestats` - User usage statistics
- `/keyhistory` - User key history
- `/loginhistory` - User login history
- `/paymentstatus` - Check payment status

## 🛡️ Original Ban Commands (8 commands)
- `/bansite` - Ban user from site
- `/unbansite` - Unban user from site
- `/ratelimited` - Rate limit user (48h)
- `/unrate` - Remove rate limit
- `/changekey` - Allow user to change key
- `/repairkey` - Repair/reset user key
- `/banIP` - Ban user's IP address
- `/unbanIP` - Unban user's IP address

## ⚙️ Advanced Administration Commands (9 commands)
- `/massban` - Ban multiple users at once
- `/massunban` - Unban multiple users at once
- `/masskeyreset` - Reset multiple keys
- `/clearexpiredkeys` - Clean all expired keys
- `/clearsuspendedkeys` - Clean all suspended keys
- `/backupkeys` - Create backup of all keys
- `/restorekeys` - Restore keys from backup
- `/exportkeys` - Export keys to CSV
- `/importkeys` - Import keys from CSV file

## 📈 Monitoring & Reports Commands (10 commands)
- `/serverstats` - General server statistics
- `/keystats` - Key statistics
- `/banstats` - Ban statistics
- `/activestats` - Activity statistics
- `/dailystats` - Daily statistics
- `/weeklystats` - Weekly statistics
- `/monthlystats` - Monthly statistics
- `/topusers` - Most active users
- `/newusers` - Recent new users
- `/expiringkeys` - Keys expiring soon

## 👑 Permission Management Commands (6 commands)
- `/giveadmin` - Give admin rights
- `/removeadmin` - Remove admin rights
- `/givemod` - Give moderator rights
- `/removemod` - Remove moderator rights
- `/givevip` - Give VIP status
- `/removevip` - Remove VIP status

## 🔧 Utility Commands (7 commands)
- `/searchuser` - Search for user
- `/findbykey` - Find user by key
- `/validatekey` - Validate key format
- `/systemhealth` - Check system health
- `/apistatus` - Check API status
- `/botinfo` - Bot information
- `/help` - Command help

## Usage Examples

### Key Management
```
/generatekey id:123456789 duration:"30d"
/extendkey id:123456789 days:"7"
/transferkey from_id:"123456789" to_id:"987654321"
```

### Status Checking
```
/userstatus id:123456789
/keyinfo id:123456789
/banstatus id:123456789
```

### IP Ban Commands
```
/banIP id:123456789
/unbanIP id:123456789
```

### Mass Operations
```
/massban ids:"123456789,987654321,555666777"
/masskeyreset ids:"123456789,987654321"
```

### Statistics
```
/serverstats
/keystats
/topusers limit:5
/expiringkeys days:7
```

## Features Added

### ✅ Enhanced User Experience
- Emoji indicators for command results (✅❌📊🔑 etc.)
- Clear, descriptive error messages
- Organized command categories
- Comprehensive help system

### ✅ Advanced Functionality
- Mass operations for bulk management
- Backup and restore capabilities
- Import/export functionality
- Real-time statistics and monitoring
- Permission management system

### ✅ Security & Validation
- Key format validation
- User tracking for all actions
- API integration with proper error handling
- Secure file handling for imports

### ✅ Monitoring & Analytics
- Multiple time-based statistics (daily/weekly/monthly)
- User activity tracking
- Key lifecycle management
- System health monitoring

## API Endpoints Expected
The bot expects the following API endpoints to be implemented:

### Key Management
- `POST /api/keys/generate/{id}`
- `DELETE /api/keys/{id}`
- `POST /api/keys/extend/{id}`
- `POST /api/keys/upgrade/{id}`
- `GET /api/keys/{id}`
- `GET /api/keys/status/{id}`
- `GET /api/keys`
- `POST /api/keys/expire/{id}`
- `POST /api/keys/suspend/{id}`
- `POST /api/keys/reactivate/{id}`
- `POST /api/keys/transfer/{fromId}/{toId}`
- `POST /api/keys/duplicate/{sourceId}/{targetId}`

### User Management
- `GET /api/user/{id}/status`
- `GET /api/user/{id}/activity`
- `GET /api/user/{id}/subscription`
- `GET /api/user/{id}/usage`
- `GET /api/user/{id}/keyhistory`
- `GET /api/user/{id}/loginhistory`
- `GET /api/user/{id}/payments`

### IP Management
- `POST /api/banip/{id}`
- `POST /api/unbanip/{id}`

### Administration
- `POST /api/mass/ban`
- `POST /api/mass/unban`
- `POST /api/mass/keyreset`
- `DELETE /api/keys/expired`
- `DELETE /api/keys/suspended`
- `POST /api/keys/backup`
- `POST /api/keys/restore`
- `GET /api/keys/export`
- `POST /api/keys/import`

### Statistics
- `GET /api/stats/server`
- `GET /api/stats/keys`
- `GET /api/stats/bans`
- `GET /api/stats/activity`
- `GET /api/stats/daily`
- `GET /api/stats/weekly`
- `GET /api/stats/monthly`
- `GET /api/stats/topusers`
- `GET /api/stats/newusers`
- `GET /api/stats/expiringkeys`

### Permissions
- `POST /api/permissions/admin/{id}`
- `POST /api/permissions/mod/{id}`
- `POST /api/permissions/vip/{id}`

### Search & Utilities
- `GET /api/search/user`
- `GET /api/search/bykey`
- `GET /api/health`
- `GET /api/status`

## Total Commands: 67+
All commands are properly categorized, have clear descriptions, and include appropriate options and parameters.
