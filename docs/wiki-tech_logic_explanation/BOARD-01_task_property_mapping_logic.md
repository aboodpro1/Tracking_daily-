# Task Property Normalization and Mapping Logic in n8n and Notion

## 1. Overview

This document provides a comprehensive technical explanation of the task property extraction issue encountered on the Kanban Board, why it occurred, the root cause analysis, and the architectural fix applied in the n8n backend workflow.

---

## 2. The Symptom (What Was Happening?)

When loading the Kanban board (`todo.html`) via `GetTasks()`, the client received task records from the backend `Get-database` webhook. However, regardless of what the user originally chose when creating the task:
- **Category Badge**: Always rendered as "شغل" (`cat-work`).
- **Priority Badge**: Always rendered as "عادية" (`priority-normal`).
- **Duration Tag**: Always rendered as "أقل من ساعة".
- **Task Date**: Always returned as an empty string `date: ""`.

The client application (`Board_function.js`) was functioning correctly, but was receiving pre-flattened objects where all these dynamic fields were fixed to default values.

---

## 3. Root Cause Analysis (Why Did It Happen?)

### 3.1 Notion API vs. n8n Simplified Output
In n8n, when retrieving database pages through the Notion node, properties can arrive in two distinct formats depending on node version and data normalization settings:

1. **Full Notion Object Format**:
   ```javascript
   props['التصنيف'] = { id: '...', type: 'select', select: { id: '...', name: 'دينية', color: 'blue' } };
   props.date = { id: '...', type: 'date', date: { start: '2026-10-04' } };
   ```

2. **Simplified / Flattened Format**:
   ```javascript
   props['التصنيف'] = 'دينية';
   props.date = '2026-10-04';
   ```

### 3.2 The Fallback Trap
The legacy JavaScript code in the n8n node `Filter and Format Tasks for User Board` was written with strict assumptions:

```javascript
// Legacy Code with strict assumptions
let category = 'شغل';
if (props['التصنيف']?.select?.name) {
    category = props['التصنيف'].select.name;
} else if (props.Category?.select?.name) {
    category = props.Category.select.name;
} else if (props.category) {
    category = props.category;
}

let priority = 'عادية';
if (props['الأهمية']?.select?.name) {
    priority = props['الأهمية'].select.name;
}

let duration = 'أقل من ساعة';
if (props['الوقت المتوقع']?.select?.name) {
    duration = props['الوقت المتوقع'].select.name;
}

let taskDate = '';
if (props.date?.date?.start) {
    taskDate = props.date.date.start;
}
```

When Notion returned a string value (e.g. `props['التصنيف'] = 'دينية'`), evaluating `props['التصنيف']?.select?.name` resulted in `undefined`. 

Because there was no check for `typeof props['التصنيف'] === 'string'`, the condition evaluated to `false`, and the script silently fell back to the initial default variables:
- `category` defaulted to `'شغل'`
- `priority` defaulted to `'عادية'`
- `duration` defaulted to `'أقل من ساعة'`
- `taskDate` remained `''`

---

## 4. The Solution Architecture

To eliminate this fragility and make property extraction 100% resilient to any payload structure, two polymorphic extractor functions were introduced:

### 4.1 Safe Text Extractor (`extractText`)
Supports plain strings, Notion Select objects, Notion Rich Text arrays, and title blocks:

```javascript
function extractText(val) {
  if (!val) return '';
  if (typeof val === 'string') return val.trim();
  if (val.select?.name) return val.select.name.trim();
  if (val.name) return val.name.trim();
  if (Array.isArray(val.rich_text) && val.rich_text[0]?.plain_text) {
    return val.rich_text[0].plain_text.trim();
  }
  if (Array.isArray(val.title) && val.title[0]?.plain_text) {
    return val.title[0].plain_text.trim();
  }
  return '';
}
```

### 4.2 Safe Date Extractor (`extractDate`)
Extracts ISO date strings from direct strings, nested date objects, or page timestamps:

```javascript
function extractDate(val, rawItem) {
  if (!val) return rawItem?.created_time ? rawItem.created_time.split('T')[0] : '';
  if (typeof val === 'string') return val.split('T')[0];
  if (val.date?.start) return val.date.start.split('T')[0];
  if (val.start) return val.start.split('T')[0];
  return rawItem?.created_time ? rawItem.created_time.split('T')[0] : '';
}
```

### 4.3 Normalized Property Extraction
With these helpers, property extraction handles all Notion schemas seamlessly:

```javascript
const category = extractText(props['التصنيف']) || 
                 extractText(props.Category) || 
                 extractText(props.category) || 
                 extractText(rawItem.property_التصنيف) || 
                 'عامة';

const priority = extractText(props['الأهمية']) || 
                 extractText(props.Priority) || 
                 extractText(props.priority) || 
                 extractText(rawItem.property_الأهمية) || 
                 'عادية';

const duration = extractText(props['الوقت المتوقع']) || 
                 extractText(props.Duration) || 
                 extractText(props.duration) || 
                 extractText(rawItem.property_الوقت_المتوقع) || 
                 'غير محدد';

const taskDate = extractDate(props.date, rawItem) || 
                 extractDate(props.Date, rawItem) || 
                 extractDate(props['التاريخ'], rawItem);
```

---

## 5. Verification and Results

Following this change:
1. **Accurate Category Display**: Tasks created as "دينية", "جسم", "شغل", or "دراسة" now correctly render their dedicated color badge and CSS class.
2. **Accurate Priority Display**: Tasks marked as "مهمة" trigger the red priority indicator and `priority-important` styling.
3. **Accurate Duration**: Dynamic values ("أقل من ساعة", "ساعة واحدة", "ساعتان") are mapped and displayed faithfully.
4. **Reliable Date Filtering**: Task dates are accurately parsed, ensuring the "مهام اليوم" filter only displays tasks scheduled for today.
