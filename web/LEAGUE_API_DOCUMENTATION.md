# 🏆 matchly League API Documentation

## Overview

The matchly League API implements a **box-based promotion/relegation system** where players are grouped by skill level and can move between boxes based on performance. This creates dynamic skill-based matchmaking that continuously adjusts to player abilities.

## 🎯 Core Concept

**Box System:**
- Players are randomly assigned to boxes when league starts
- Each box contains 4-6 players (optimal: 5 players)
- Players in each box play round-robin matches
- After each round, top performers promote up, bottom performers relegate down
- Creates natural skill-based matchmaking over time

## 📋 API Endpoints

### 1. League Management

#### Create League
```http
POST /api/leagues
```

**Request Body:**
```json
{
  "name": "Spring Squash Championship",
  "description": "A competitive squash league for all skill levels",
  "sport": "squash",
  "max_players": 20,
  "start_date": "2024-03-15",
  "location": "City Sports Center",
  "entry_fee": 25.00,
  "prize_pool": 200.00
}
```

**Response:**
```json
{
  "message": "League created successfully",
  "league": {
    "id": "uuid",
    "name": "Spring Squash Championship",
    "description": "A competitive squash league...",
    "sport": "squash",
    "max_players": 20,
    "current_players": 1,
    "start_date": "2024-03-15",
    "location": "City Sports Center",
    "entry_fee": 25.00,
    "prize_pool": 200.00,
    "status": "open",
    "invite_code": "ABC12345",
    "invite_link": "https://matchly.app/join/ABC12345",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

#### Get Leagues
```http
GET /api/leagues?status=open&sport=squash
```

**Response:**
```json
{
  "leagues": [
    {
      "id": "uuid",
      "name": "Spring Squash Championship",
      "sport": "squash",
      "max_players": 20,
      "current_players": 15,
      "status": "open",
      "invite_code": "ABC12345",
      "created_by_user": {
        "id": "uuid",
        "email": "admin@example.com"
      }
    }
  ]
}
```

### 2. League Participation

#### Join League
```http
POST /api/leagues/join
```

**Request Body:**
```json
{
  "invite_code": "ABC12345"
}
```

**Response:**
```json
{
  "message": "Successfully joined league",
  "league": {
    "id": "uuid",
    "name": "Spring Squash Championship",
    "sport": "squash",
    "max_players": 20,
    "current_players": 16,
    "status": "open",
    "invite_code": "ABC12345"
  }
}
```

### 3. League Operations

#### Start League
```http
POST /api/leagues/{leagueId}/start
```

**Response:**
```json
{
  "message": "League started successfully",
  "league_id": "uuid",
  "participants": 20,
  "box_configuration": {
    "total_players": 20,
    "box_count": 4,
    "players_per_box": 5,
    "box_size_range": "4-6"
  },
  "boxes_created": 4,
  "matches_generated": 40
}
```

**What happens when league starts:**
1. ✅ Validates minimum 4 players
2. ✅ Calculates optimal box configuration
3. ✅ Creates boxes (4 boxes of 5 players each for 20 players)
4. ✅ Randomly assigns players to boxes
5. ✅ Generates round-robin matches for each box
6. ✅ Updates league status to "started"

### 4. Box Management

#### Get League Boxes
```http
GET /api/leagues/{leagueId}/boxes
```

**Response:**
```json
{
  "league_id": "uuid",
  "boxes": [
    {
      "box_id": "uuid",
      "box_number": 1,
      "box_level": 4,
      "box_name": "Premier Box",
      "max_players": 5,
      "current_players": 5,
      "status": "active",
      "participants": [
        {
          "user_id": "uuid",
          "status": "active",
          "matches_played": 0,
          "matches_won": 0,
          "matches_lost": 0,
          "users": {
            "id": "uuid",
            "email": "player1@example.com",
            "raw_user_meta_data": {
              "name": "John Doe"
            }
          }
        }
      ]
    }
  ]
}
```

#### Get Box Standings
```http
GET /api/leagues/{leagueId}/boxes/{boxId}/standings
```

**Response:**
```json
{
  "league_id": "uuid",
  "box_id": "uuid",
  "standings": [
    {
      "user_id": "uuid",
      "position": 1,
      "matches_played": 4,
      "matches_won": 4,
      "matches_lost": 0,
      "sets_won": 12,
      "sets_lost": 0,
      "points_won": 132,
      "points_lost": 45,
      "win_percentage": 100.00,
      "set_percentage": 100.00,
      "user": {
        "id": "uuid",
        "email": "player1@example.com",
        "raw_user_meta_data": {
          "name": "John Doe"
        }
      }
    }
  ]
}
```

### 5. Match Management

#### Get League Matches
```http
GET /api/leagues/{leagueId}/matches?box_id={boxId}&status=scheduled
```

**Response:**
```json
{
  "league_id": "uuid",
  "matches": [
    {
      "id": "uuid",
      "league_id": "uuid",
      "box_id": "uuid",
      "player1_id": "uuid",
      "player2_id": "uuid",
      "status": "scheduled",
      "match_type": "round_robin",
      "scheduled_at": "2024-03-20T14:00:00Z",
      "court_number": 1,
      "player1_score": 0,
      "player2_score": 0,
      "sets_to_win": 3,
      "points_to_win": 11,
      "current_set": 1,
      "player1": {
        "id": "uuid",
        "email": "player1@example.com",
        "raw_user_meta_data": {
          "name": "John Doe"
        }
      },
      "player2": {
        "id": "uuid",
        "email": "player2@example.com",
        "raw_user_meta_data": {
          "name": "Jane Smith"
        }
      },
      "box": {
        "id": "uuid",
        "box_number": 1,
        "box_level": 4,
        "box_name": "Premier Box"
      }
    }
  ]
}
```

#### Create Match
```http
POST /api/leagues/{leagueId}/matches
```

**Request Body:**
```json
{
  "player1_id": "uuid",
  "player2_id": "uuid",
  "box_id": "uuid",
  "scheduled_at": "2024-03-20T14:00:00Z",
  "court_number": 1
}
```

### 6. Promotion/Relegation

#### Process Promotion/Relegation
```http
POST /api/leagues/{leagueId}/promotion
```

**Response:**
```json
{
  "message": "Promotion/relegation processed successfully",
  "league_id": "uuid",
  "promotions": [
    {
      "user_id": "uuid",
      "action": "promoted",
      "from_box": 2,
      "to_box": 1
    }
  ],
  "relegations": [
    {
      "user_id": "uuid",
      "action": "relegated",
      "from_box": 1,
      "to_box": 2
    }
  ],
  "total_movements": 2
}
```

**Promotion/Relegation Logic:**
- ✅ Top 20% of each box promote to higher box
- ✅ Bottom 20% of each box relegate to lower box
- ✅ Middle players stay in current box
- ✅ Players in highest box can't promote further
- ✅ Players in lowest box can't relegate further
- ✅ Records all movements in promotion history

## 🗄️ Database Schema

### Core Tables

**`leagues`** - Main league information
**`league_participants`** - Who's in each league
**`league_boxes`** - Box structure and levels
**`league_box_assignments`** - Which players are in which boxes
**`league_matches`** - All matches with box assignments
**`league_box_standings`** - Performance tracking per box
**`league_promotion_history`** - Track all promotions/relegations

### Key Features

- ✅ **Automatic Box Assignment**: Random initial assignment, then skill-based
- ✅ **Round-Robin Matches**: Each player plays every other player in their box
- ✅ **Performance Tracking**: Win/loss records, set scores, point differentials
- ✅ **Dynamic Movement**: Automatic promotion/relegation based on performance
- ✅ **History Tracking**: Complete record of all player movements
- ✅ **Flexible Configuration**: Supports 4-32 players with optimal box sizing

## 🚀 Usage Flow

1. **Create League**: Admin creates league with details
2. **Share Invite**: Players join using invite code
3. **Start League**: Admin starts league when ready
4. **Box Assignment**: System creates boxes and assigns players randomly
5. **Play Matches**: Players play round-robin in their boxes
6. **Track Performance**: System tracks wins/losses and standings
7. **Process Movement**: Admin triggers promotion/relegation
8. **Repeat**: Continue playing with new box assignments

## 🎯 Benefits

- **Natural Skill Matching**: Players naturally find their skill level
- **Continuous Competition**: Always playing against similarly skilled opponents
- **Motivation**: Clear path to promotion, risk of relegation
- **Fair Play**: No artificial skill ratings, based on actual performance
- **Scalable**: Works with any number of players (4-32+)

This system creates a dynamic, competitive environment where players are constantly challenged at their appropriate skill level!
