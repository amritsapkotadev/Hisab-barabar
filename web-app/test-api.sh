#!/bin/bash

# API Testing Script for Hisab Barabar
# This script tests all major API endpoints

API_URL="http://localhost:3000/api"
TOKEN=""

echo "🧪 Testing Hisab Barabar API Endpoints"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Register User
echo -e "${YELLOW}Test 1: Register User${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "testuser@example.com",
    "phone": "1234567890",
    "password": "password123"
  }')

echo "$REGISTER_RESPONSE" | jq '.'
if echo "$REGISTER_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Register test passed${NC}\n"
else
  echo -e "${RED}✗ Register test failed${NC}\n"
fi

# Test 2: Login User
echo -e "${YELLOW}Test 2: Login User${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "password123"
  }')

echo "$LOGIN_RESPONSE" | jq '.'
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
  echo -e "${GREEN}✓ Login test passed${NC}"
  echo -e "Token: $TOKEN\n"
else
  echo -e "${RED}✗ Login test failed${NC}\n"
  exit 1
fi

# Test 3: Get User Profile
echo -e "${YELLOW}Test 3: Get User Profile${NC}"
PROFILE_RESPONSE=$(curl -s -X GET "$API_URL/users/profile" \
  -H "Authorization: Bearer $TOKEN")

echo "$PROFILE_RESPONSE" | jq '.'
if echo "$PROFILE_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Get profile test passed${NC}\n"
else
  echo -e "${RED}✗ Get profile test failed${NC}\n"
fi

# Test 4: Create Group
echo -e "${YELLOW}Test 4: Create Group${NC}"
GROUP_RESPONSE=$(curl -s -X POST "$API_URL/groups" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Trip",
    "description": "Weekend getaway",
    "members": ["Test User", "Alice", "Bob"],
    "emoji": "✈️"
  }')

echo "$GROUP_RESPONSE" | jq '.'
GROUP_ID=$(echo "$GROUP_RESPONSE" | jq -r '.data.id')

if [ "$GROUP_ID" != "null" ] && [ -n "$GROUP_ID" ]; then
  echo -e "${GREEN}✓ Create group test passed${NC}"
  echo -e "Group ID: $GROUP_ID\n"
else
  echo -e "${RED}✗ Create group test failed${NC}\n"
fi

# Test 5: Get All Groups
echo -e "${YELLOW}Test 5: Get All Groups${NC}"
GROUPS_RESPONSE=$(curl -s -X GET "$API_URL/groups" \
  -H "Authorization: Bearer $TOKEN")

echo "$GROUPS_RESPONSE" | jq '.'
if echo "$GROUPS_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Get groups test passed${NC}\n"
else
  echo -e "${RED}✗ Get groups test failed${NC}\n"
fi

# Test 6: Create Expense
echo -e "${YELLOW}Test 6: Create Expense${NC}"
EXPENSE_RESPONSE=$(curl -s -X POST "$API_URL/expenses" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"groupId\": \"$GROUP_ID\",
    \"description\": \"Dinner at restaurant\",
    \"amount\": 150,
    \"paidBy\": \"Test User\",
    \"participants\": [\"Test User\", \"Alice\", \"Bob\"],
    \"date\": \"2024-01-15\"
  }")

echo "$EXPENSE_RESPONSE" | jq '.'
EXPENSE_ID=$(echo "$EXPENSE_RESPONSE" | jq -r '.data.id')

if [ "$EXPENSE_ID" != "null" ] && [ -n "$EXPENSE_ID" ]; then
  echo -e "${GREEN}✓ Create expense test passed${NC}"
  echo -e "Expense ID: $EXPENSE_ID\n"
else
  echo -e "${RED}✗ Create expense test failed${NC}\n"
fi

# Test 7: Get All Expenses
echo -e "${YELLOW}Test 7: Get All Expenses${NC}"
EXPENSES_RESPONSE=$(curl -s -X GET "$API_URL/expenses" \
  -H "Authorization: Bearer $TOKEN")

echo "$EXPENSES_RESPONSE" | jq '.'
if echo "$EXPENSES_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Get expenses test passed${NC}\n"
else
  echo -e "${RED}✗ Get expenses test failed${NC}\n"
fi

# Test 8: Create Personal Expense
echo -e "${YELLOW}Test 8: Create Personal Expense${NC}"
PERSONAL_EXPENSE_RESPONSE=$(curl -s -X POST "$API_URL/expenses/personal" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Coffee",
    "amount": 5.50,
    "date": "2024-01-15",
    "paidBy": "Test User",
    "participants": ["Test User"]
  }')

echo "$PERSONAL_EXPENSE_RESPONSE" | jq '.'
if echo "$PERSONAL_EXPENSE_RESPONSE" | jq -e '.data' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Create personal expense test passed${NC}\n"
else
  echo -e "${RED}✗ Create personal expense test failed${NC}\n"
fi

# Test 9: Set Budget
echo -e "${YELLOW}Test 9: Set Budget${NC}"
BUDGET_RESPONSE=$(curl -s -X POST "$API_URL/users/budget" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "budget": 5000
  }')

echo "$BUDGET_RESPONSE" | jq '.'
if echo "$BUDGET_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Set budget test passed${NC}\n"
else
  echo -e "${RED}✗ Set budget test failed${NC}\n"
fi

echo "======================================"
echo -e "${GREEN}🎉 API Testing Complete!${NC}"
echo ""
echo "Summary:"
echo "- All major endpoints have been tested"
echo "- Check the output above for any failures"
echo "- Token: $TOKEN"
echo "- Group ID: $GROUP_ID"
echo "- Expense ID: $EXPENSE_ID"
