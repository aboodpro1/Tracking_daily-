# Notion Database Schema and Architecture

## 1. Overview

This document outlines the configured Notion databases for the Daily Tracking application using the integration token.

---

## 2. Configured Databases

### 2.1 Users Database
- **Database ID**: `3dc6fd16-45b0-80ff-8435-c255ed191886`
- **Purpose**: Stores user credentials, profile information, authentication status, and role permissions.
- **Properties**:
  | Column Name | Type | Description | Options / Values |
  | :--- | :--- | :--- | :--- |
  | `Name` | `title` | Full name of the user | Text |
  | `Email` | `email` | Primary login email address | Valid email |
  | `Password` | `rich_text` | Hashed/secured password string | Text |
  | `User ID` | `rich_text` | Unique system identifier | UUID |
  | `Role` | `select` | User permission role | `Admin` (red), `Lead` (purple), `Member` (blue) |
  | `Status` | `select` | Account state | `Active` (green), `Inactive` (gray), `Suspended` (red) |
  | `Last Login` | `date` | Timestamp of last session activity | Date/Time |
  | `Tasks` | `relation` | 2-way relation with Tasks database | Links to `Tasks` (`Assigned User`) |
  | `Created At` | `created_time` | Automatic creation timestamp | System date |
  | `Updated At` | `last_edited_time` | Automatic modification timestamp | System date |

---

### 2.2 Tasks Database
- **Database ID**: `3dc6fd16-45b0-8072-9e75-fb87ba35ed28`
- **Purpose**: Kanban board and daily task tracking.
- **Key Properties**:
  - `العنوان` (`title`): Task title
  - `الحالة` (`select`): Task status
  - `الوصف` (`rich_text`): Task description
  - `الأهمية` (`select`): Priority
  - `التصنيف` (`select`): Category
  - `date` (`date`): Scheduled date
  - `الوقت المتوقع` (`select`) / `الوقت المخصص` (`number`): Duration
  - `Assigned User` (`relation`): Linked user from `Users` database

---

### 2.3 Standalone / Historical Databases
- **Daily Tracking**: `3dd6fd16-45b0-8091-80e2-c051fe20be34`
- **Daily Performance**: `3e96fd16-45b0-80c7-ac4c-f8f13ba62e2b`
*(Kept isolated without foreign key relations to avoid clutter)*
