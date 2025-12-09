Feature: Songs Management

  Background:
    Given a song with title "Test Song" and file "test_song.mp3"
    And the response status code is 201

  Scenario: Get a song by ID
    When I request the song "Test Song" by its ID
    Then the response status code is 200
    And the song title should be "Test Song"
    And the response should match the Song DTO structure

  Scenario: Search for a song
    When I search for songs with query "Test"
    Then the response status code is 200
    And the response should contain a song with title "Test Song"

  Scenario: Get random songs
    Given a song with title "Random Song" and file "test_song.mp3"
    When I request 5 random songs
    Then the response status code is 200
    And I should receive a list containing the song "Random Song"

  Scenario: Add video to a song
    Given a song with title "Video Song" and file "test_song.mp3"
    When I attach a video "test_video.mp4" to the song "Video Song"
    Then the response status code is 201
    And the song should have video available
    And the response should match the Song DTO structure

  Scenario: Upload a song with video
    When I upload a song "Song With Video" with file "test_song.mp3" and video "test_video.mp4"
    Then the response status code is 201
    And the song should have video available
    And the response should match the Song DTO structure

  Scenario: Update song availability globally
    When I update the availability of song "Test Song" with status "region-blocked" and scope "global"
    Then the response status code is 200
    And the song status should be "region-blocked"
    And all regions should have allowed set to false
    And the audit log should contain an "availability-update" action

  Scenario: Update song availability for specific regions
    When I update the availability of song "Test Song" for regions "ar,mx" with status "region-blocked"
    Then the response status code is 200
    And the regions "ar,mx" should have status "region-blocked"
    And the regions "ar,mx" should have allowed set to false
    And the audit log should contain regions "AR,MX"

  Scenario: Update song status to scheduled with validity period
    When I update the availability of song "Test Song" with status "scheduled" from "2025-12-10T00:00:00Z" to "2025-12-31T23:59:59Z"
    Then the response status code is 200
    And the song status should be "scheduled"
    And the audit log should contain validity information

  Scenario: Block song globally using admin block
    When I block song "Test Song" globally with reason code "legal"
    Then the response status code is 201
    And the song status should be "blocked"
    And all regions should have status "admin-blocked"

  Scenario: Unblock a previously blocked song
    Given the song "Test Song" is blocked globally with reason code "policy"
    When I unblock song "Test Song"
    Then the response status code is 201
    And the song status should be "published"
    And all regions should have allowed set to true
