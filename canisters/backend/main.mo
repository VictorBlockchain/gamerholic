import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Time "mo:base/Time";
import Array "mo:base/Array";
import Text "mo:base/Text";
import Char "mo:base/Char";
import Nat64 "mo:base/Nat64";
import Int "mo:base/Int";
import Nat "mo:base/Nat";
import Buffer "mo:base/Buffer";
import Nat32 "mo:base/Nat32";
import Nat8 "mo:base/Nat8";
import Blob "mo:base/Blob";
import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Float "mo:base/Float";
import Order "mo:base/Order";
// import SHA224 "mo:sha2/SHA224";

persistent actor Gamerholic {
  type Address = Text;
  type TournamentId = Text;
  type ChallengeId = Text;

  type TournamentInfo = {
    creator : Address;
    entryFee : Nat;
    maxParticipants : Nat;
    xftToJoin : Nat;
    createdAt : Nat64;
    deadline : Nat64;
    gameType : Text;
    metadata : Text;
    payToken : Text;
    isFFA : Bool;
    status : Nat;
    totalPrizePool : Nat;
    hostFeeBps : Nat;
    // ── New product fields ──
    title : Text;
    console : Text;
    scheduledAt : Nat64;
    betable : Bool;
    marketId : Text;
    teamEntry : Bool;
    registrationOpen : Bool;
    streamUrl : Text;
    coverUrl : Text;
  };

  // Team functionality types
  type TeamId = Text;
  
  type TeamInfo = {
    id : TeamId;
    name : Text;
    captain : Address;
    members : [Address];
    createdAt : Nat64;
    avatar : Text;
    description : Text;
    gameSpecialties : [Text];
    tournamentWins : Nat;
    tournamentLosses : Nat;
    totalEarnings : Nat;
    isActive : Bool;
  };

  type TeamInvitation = {
    teamId : TeamId;
    inviter : Address;
    invitee : Address;
    status : { #Pending; #Accepted; #Rejected; #Expired };
    createdAt : Nat64;
    expiresAt : Nat64;
    /** Share of team prize (basis points, 0–10000) offered on invite */
    winSplitBps : Nat;
  };

  /// Per-member share of team winnings (basis points of the team prize pool; must sum to 10000)
  type TeamMemberSplit = {
    member : Address;
    winSplitBps : Nat;
  };

  type TeamClaimLine = {
    member : Address;
    winSplitBps : Nat;
    amount : Nat;
  };

  type TeamClaimPreview = {
    pot : Nat;
    hostFeeBps : Nat;
    hostCut : Nat;
    platformRake : Nat;
    teamPrizePool : Nat;
    teamId : TeamId;
    lines : [TeamClaimLine];
    splitsValid : Bool;
    splitsTotalBps : Nat;
  };

  // Comprehensive Monitoring & Operations Functions
  public func getSystemMetrics() : async SystemMetrics {
    let now = Nat64.fromNat(Int.abs(Time.now()));
    
    // Calculate metrics
    var totalChallenges = 0;
    var activeChallenges = 0;
    var completedChallenges = 0;
    var disputedChallenges = 0;
    
    for ((_, challenge) in challenges.entries()) {
      totalChallenges += 1;
      switch (challenge.status) {
        case (1) activeChallenges += 1; // Active
        case (3) completedChallenges += 1; // Scored
        case (4) completedChallenges += 1; // Confirmed
        case (5) disputedChallenges += 1; // Disputed
        case (_) {};
      };
    };
    
    var totalTournaments = 0;
    var activeTournaments = 0;
    var completedTournaments = 0;
    var totalParticipants = 0;
    var totalPrizePool = 0;
    
    for ((_, tournament) in tournaments.entries()) {
      totalTournaments += 1;
      switch (tournament.status) {
        case (1) activeTournaments += 1; // Open
        case (2) activeTournaments += 1; // In Progress
        case (3) completedTournaments += 1; // Completed
        case (_) {};
      };
      totalPrizePool += tournament.totalPrizePool;
    };
    
    // Count unique participants
    var uniqueParticipants = HashMap.HashMap<Address, Bool>(256, Text.equal, Text.hash);
    for ((_, participants) in tournamentParticipants.entries()) {
      for (participant in participants.vals()) {
        uniqueParticipants.put(participant, true);
      };
    };
    totalParticipants := uniqueParticipants.size();
    
    var totalRake : Nat = 0;
    
    let metrics : SystemMetrics = {
      totalChallenges = totalChallenges;
      activeChallenges = activeChallenges;
      completedChallenges = completedChallenges;
      disputedChallenges = disputedChallenges;
      totalTournaments = totalTournaments;
      activeTournaments = activeTournaments;
      completedTournaments = completedTournaments;
      totalParticipants = totalParticipants;
      totalPrizePool = totalPrizePool;
      totalRakeCollected = totalRake;
      systemUptime = now - systemStartTime;
      lastHealthCheck = now;
    };
    
    systemMetrics.put("current", metrics);
    metrics
  };

  public func getPerformanceMetrics() : async PerformanceMetrics {
    let now = Nat64.fromNat(Int.abs(Time.now()));
    
    // Calculate average completion times
    var avgChallengeTime : Nat64 = 0;
    if (challengeCompletionTimes.size() > 0) {
      var totalTime = 0;
      for (time in challengeCompletionTimes.vals()) {
        totalTime += Nat64.toNat(time);
      };
      avgChallengeTime := Nat64.fromNat(totalTime / challengeCompletionTimes.size());
    };
    
    var avgTournamentTime : Nat64 = 0;
    if (tournamentCompletionTimes.size() > 0) {
      var totalTime = 0;
      for (time in tournamentCompletionTimes.vals()) {
        totalTime += Nat64.toNat(time);
      };
      avgTournamentTime := Nat64.fromNat(totalTime / tournamentCompletionTimes.size());
    };
    
    // Calculate dispute rate
    var disputeRate : Float = 0;
    let totalChallenges = challenges.size();
    var disputedCount = 0;
    for ((_, challenge) in challenges.entries()) {
      if (challenge.status == 5) { disputedCount += 1 }; // Disputed
    };
    if (totalChallenges > 0) {
      disputeRate := Float.fromInt(disputedCount) / Float.fromInt(totalChallenges) * 100.0;
    };
    
    // Calculate completion rates
    var tournamentCompletionRate : Float = 0;
    let totalTournaments = tournaments.size();
    var completedCount = 0;
    for ((_, tournament) in tournaments.entries()) {
      if (tournament.status == 3) { completedCount += 1 }; // Completed
    };
    if (totalTournaments > 0) {
      tournamentCompletionRate := Float.fromInt(completedCount) / Float.fromInt(totalTournaments) * 100.0;
    };
    
    // Active users (simplified - based on recent activity)
    let activeUsers = userActivityLog.size();
    
    // Calculate daily/weekly/monthly active users (simplified)
    let dayAgo = now - 86400;
    let weekAgo = now - 604800;
    let monthAgo = now - 2592000;
    
    var dailyActive = 0;
    var weeklyActive = 0;
    var monthlyActive = 0;
    
    for ((_, activities) in userActivityLog.entries()) {
      var isDaily = false;
      var isWeekly = false;
      var isMonthly = false;
      
      for (activity in activities.vals()) {
        let (timestamp, _) = activity;
        if (timestamp > dayAgo) { isDaily := true };
        if (timestamp > weekAgo) { isWeekly := true };
        if (timestamp > monthAgo) { isMonthly := true };
      };
      
      if (isDaily) { dailyActive += 1 };
      if (isWeekly) { weeklyActive += 1 };
      if (isMonthly) { monthlyActive += 1 };
    };
    
    let performance : PerformanceMetrics = {
      averageChallengeCompletionTime = avgChallengeTime;
      averageTournamentCompletionTime = avgTournamentTime;
      challengeDisputeRate = disputeRate;
      tournamentCompletionRate = tournamentCompletionRate;
      activeUsers = activeUsers;
      dailyActiveUsers = dailyActive;
      weeklyActiveUsers = weeklyActive;
      monthlyActiveUsers = monthlyActive;
    };
    
    performanceMetrics.put("current", performance);
    performance
  };

  public func getHealthStatus() : async HealthStatus {
    let now = Nat64.fromNat(Int.abs(Time.now()));
    var components : [{
      name : Text;
      status : { #Healthy; #Degraded; #Unhealthy; #Critical };
      message : Text;
      lastCheck : Nat64;
    }] = [];
    
    // Check challenge system health
    var challengeHealth : { #Healthy; #Degraded; #Unhealthy; #Critical } = #Healthy;
    var challengeMessage = "All systems operational";
    let disputeRate = await getPerformanceMetrics();
    if (disputeRate.challengeDisputeRate > 10.0) {
      challengeHealth := #Degraded;
      challengeMessage := "High dispute rate detected: " # Float.toText(disputeRate.challengeDisputeRate) # "%";
    };
    if (disputeRate.challengeDisputeRate > 25.0) {
      challengeHealth := #Unhealthy;
    };
    
    components := Array.append(components, [{
      name = "Challenge System";
      status = challengeHealth;
      message = challengeMessage;
      lastCheck = now;
    }]);
    
    // Check tournament system health
    var tournamentHealth : { #Healthy; #Degraded; #Unhealthy; #Critical } = #Healthy;
    var tournamentMessage = "Tournament system operational";
    if (disputeRate.tournamentCompletionRate < 50.0) {
      tournamentHealth := #Degraded;
      tournamentMessage := "Low tournament completion rate: " # Float.toText(disputeRate.tournamentCompletionRate) # "%";
    };
    
    components := Array.append(components, [{
      name = "Tournament System";
      status = tournamentHealth;
      message = tournamentMessage;
      lastCheck = now;
    }]);
    
    // Check system load
    var systemHealth : { #Healthy; #Degraded; #Unhealthy; #Critical } = #Healthy;
    let metrics = await getSystemMetrics();
    if (metrics.activeChallenges > 1000) {
      systemHealth := #Degraded;
    };
    if (metrics.activeTournaments > 100) {
      systemHealth := #Degraded;
    };
    
    components := Array.append(components, [{
      name = "System Load";
      status = systemHealth;
      message = "System load within normal parameters";
      lastCheck = now;
    }]);
    
    // Calculate overall score
    var overallScore = 100;
    for (component in components.vals()) {
      switch (component.status) {
        case (#Healthy) { overallScore -= 0 };
        case (#Degraded) { overallScore -= 15 };
        case (#Unhealthy) { overallScore -= 40 };
        case (#Critical) { overallScore -= 70 };
      };
    };
    
    // Generate recommendations
    var recommendations : [Text] = [];
    if (disputeRate.challengeDisputeRate > 10.0) {
      recommendations := Array.append(recommendations, ["Consider reviewing challenge resolution processes to reduce dispute rate"]);
    };
    if (disputeRate.tournamentCompletionRate < 50.0) {
      recommendations := Array.append(recommendations, ["Investigate reasons for low tournament completion rates"]);
    };
    if (metrics.activeChallenges > 1000) {
      recommendations := Array.append(recommendations, ["High number of active challenges - consider scaling resources"]);
    };
    
    let overallStatus = if (overallScore >= 90) { #Healthy } 
      else if (overallScore >= 70) { #Degraded }
      else if (overallScore >= 40) { #Unhealthy }
      else { #Critical };
    
    {
      status = overallStatus;
      components = components;
      overallScore = overallScore;
      recommendations = recommendations;
    }
  };

  public func createSystemAlert(alertType : { #HighDisputeRate; #LowCompletionRate; #SystemOverload; #SecurityBreach; #PerformanceDegradation; #Custom }, 
                               severity : { #Critical; #High; #Medium; #Low; #Info }, 
                               message : Text, 
                               metadata : ?Text) : async Text {
    let now = Nat64.fromNat(Int.abs(Time.now()));
    let alertId = "alert_" # Nat64.toText(now) # "_" # Nat.toText(systemAlertList.size());
    
    let alert : SystemAlert = {
      id = alertId;
      kind = alertType;
      severity = severity;
      message = message;
      timestamp = now;
      resolved = false;
      metadata = metadata;
    };
    
    systemAlerts.put(alertId, alert);
    systemAlertList.add(alert);
    
    alertId
  };

  public func getSystemAlerts(resolved : ?Bool) : async [SystemAlert] {
    var filteredAlerts : [SystemAlert] = [];
    
    for (i in Iter.range(0, systemAlertList.size() - 1)) {
      let alert = systemAlertList.get(i);
      switch (resolved) {
        case (?resolvedFilter) {
          if (alert.resolved == resolvedFilter) {
            filteredAlerts := Array.append(filteredAlerts, [alert]);
          };
        };
        case null {
          filteredAlerts := Array.append(filteredAlerts, [alert]);
        };
      };
    };
    
    filteredAlerts
  };

  public func resolveSystemAlert(alertId : Text) : async Bool {
    switch (systemAlerts.get(alertId)) {
      case (?alert) {
        let resolvedAlert = { alert with resolved = true };
        systemAlerts.put(alertId, resolvedAlert);
        
        // Update in list
        for (i in Iter.range(0, systemAlertList.size() - 1)) {
          if (systemAlertList.get(i).id == alertId) {
            systemAlertList.put(i, resolvedAlert);
            return true;
          };
        };
        false
      };
      case null false;
    }
  };

  public func logUserActivity(user : Address, activity : Text) : async () {
    let now = Nat64.fromNat(Int.abs(Time.now()));
    
    switch (userActivityLog.get(user)) {
      case (?activities) {
        let updatedActivities = Array.append<(Nat64, Text)>(activities, [(now, activity)]);
        // Keep only last 100 activities per user to prevent memory bloat
        let trimmedActivities = if (updatedActivities.size() > 100) {
          Array.subArray<(Nat64, Text)>(updatedActivities, updatedActivities.size() - 100, 100)
        } else {
          updatedActivities
        };
        userActivityLog.put(user, trimmedActivities);
      };
      case null {
        userActivityLog.put(user, [(now, activity)]);
      };
    };
  };

  public func getUserActivity(user : Address, limit : ?Nat) : async [(Nat64, Text)] {
    switch (userActivityLog.get(user)) {
      case (?activities) {
        switch (limit) {
          case (?max) {
            if (activities.size() > max) {
              Array.subArray<(Nat64, Text)>(activities, activities.size() - max, max)
            } else {
              activities
            }
          };
          case null activities;
        }
      };
      case null [];
    }
  };

  // Monitoring and Operations Types
  type SystemMetrics = {
    totalChallenges : Nat;
    activeChallenges : Nat;
    completedChallenges : Nat;
    disputedChallenges : Nat;
    totalTournaments : Nat;
    activeTournaments : Nat;
    completedTournaments : Nat;
    totalParticipants : Nat;
    totalPrizePool : Nat;
    totalRakeCollected : Nat;
    systemUptime : Nat64;
    lastHealthCheck : Nat64;
  };

  type PerformanceMetrics = {
    averageChallengeCompletionTime : Nat64;
    averageTournamentCompletionTime : Nat64;
    challengeDisputeRate : Float;
    tournamentCompletionRate : Float;
    activeUsers : Nat;
    dailyActiveUsers : Nat;
    weeklyActiveUsers : Nat;
    monthlyActiveUsers : Nat;
  };

  type SystemAlert = {
    id : Text;
    kind : { #HighDisputeRate; #LowCompletionRate; #SystemOverload; #SecurityBreach; #PerformanceDegradation; #Custom };
    severity : { #Critical; #High; #Medium; #Low; #Info };
    message : Text;
    timestamp : Nat64;
    resolved : Bool;
    metadata : ?Text;
  };

  type HealthStatus = {
    status : { #Healthy; #Degraded; #Unhealthy; #Critical };
    components : [{
      name : Text;
      status : { #Healthy; #Degraded; #Unhealthy; #Critical };
      message : Text;
      lastCheck : Nat64;
    }];
    overallScore : Nat; // 0-100
    recommendations : [Text];
  };

  // Enhanced bracket management functions
  public func setTournamentSeeds(id : TournamentId, seeds : [(Address, Nat)]) : async Bool {
    switch (tournaments.get(id)) {
      case null { return false };
      case (?t) {
        // Only allow seeding before tournament starts
        if (t.status != 1) { return false }; // Must be in "open" status
        
        tournamentSeeds.put(id, seeds);
        true
      }
    }
  };

  public func getTournamentSeeds(id : TournamentId) : async [(Address, Nat)] {
    switch (tournamentSeeds.get(id)) {
      case (?seeds) seeds;
      case null [];
    }
  };

  public func getTournamentBracketSeeds(id : TournamentId) : async [(Address, Nat)] {
    switch (tournamentBracketSeeds.get(id)) {
      case (?seeds) seeds;
      case null [];
    }
  };

  public func getTournamentBracketPositions(id : TournamentId) : async [(Address, ?ChallengeId, ?Address)] {
    switch (tournamentBracketPositions.get(id)) {
      case (?positions) positions;
      case null [];
    }
  };

  public func getTournamentBracketProgression(id : TournamentId) : async [(Nat, Nat, Nat)] {
    switch (tournamentBracketProgression.get(id)) {
      case (?progression) progression;
      case null [];
    }
  };

  // Function to get current bracket matches with detailed status
  public query func getCurrentBracketMatches(id : TournamentId) : async ?[{
    round : Nat;
    position : Nat;
    player1 : Address;
    player2 : Address;
    challengeId : ?ChallengeId;
    winner : ?Address;
    status : Text;
  }] {
    switch (tournaments.get(id)) {
      case null null;
      case (?t) {
        let rounds = switch (tournamentRounds.get(id)) { case (?r) r; case null [] };
        let positions = switch (tournamentBracketPositions.get(id)) { case (?p) p; case null [] };
        
        if (rounds.size() == 0) { return ?[] };
        
        let currentRound = rounds.size() - 1;
        var matches : [{
          round : Nat;
          position : Nat;
          player1 : Address;
          player2 : Address;
          challengeId : ?ChallengeId;
          winner : ?Address;
          status : Text;
        }] = [];
        
        // Get current round challenges
        let currentRoundChallenges = rounds[currentRound];
        
        // Group positions by matches (pairs of players)
        var i = 0;
        var matchIndex = 0;
        while (i < positions.size()) {
          let (player1, challengeId1, winner1) = positions[i];
          if (i + 1 < positions.size()) {
            let (player2, challengeId2, winner2) = positions[i + 1];
            
            if (player1 != "" and player2 != "") {
              // Find challenge for this match
              var matchChallengeId : ?ChallengeId = null;
              for (challengeId in currentRoundChallenges.vals()) {
                switch (challenges.get(challengeId)) {
                  case (?challenge) {
                    let participants = switch (challengeParticipants.get(challengeId)) { case (?xs) xs; case null [] };
                    if (participants.size() >= 2) {
                      if ((participants[0] == player1 and participants[1] == player2) or 
                          (participants[0] == player2 and participants[1] == player1)) {
                        matchChallengeId := ?challengeId;
                      };
                    };
                  };
                  case null {};
                };
              };
              
              // Determine match status
              var matchStatus = "pending";
              switch (matchChallengeId) {
                case (?cid) {
                  switch (settlementsCh.get(cid)) {
                    case (?settlement) {
                      matchStatus := "completed";
                    };
                    case null {
                      switch (challenges.get(cid)) {
                        case (?challenge) {
                          if (challenge.status == 3 or challenge.status == 4) {
                            matchStatus := "scored";
                          } else if (challenge.status == 0) {
                            matchStatus := "cancelled";
                          } else if (challenge.status == 5) {
                            matchStatus := "disputed";
                          };
                        };
                        case null {};
                      };
                    };
                  };
                };
                case null {};
              };
              
              matches := Array.append(matches, [{
                round = currentRound;
                position = matchIndex;
                player1 = player1;
                player2 = player2;
                challengeId = matchChallengeId;
                winner = if (matchStatus == "completed") { winner1 } else { null };
                status = matchStatus;
              }]);
              
              matchIndex += 1;
            };
          };
          
          i := i + 2;
        };
        
        ?matches
      }
    }
  };

  // Helper function to extract query parameters
  func getQueryParamText(url : Text, param : Text, default : ?Text) : ?Text {
    let parts = Text.split(url, #char '?');
    var queryString = "";
    var i = 0;
    for (part in parts) {
      if (i == 1) {
        queryString := part;
      };
      i += 1;
    };
    
    if (queryString == "") { return default };
    
    let params = Text.split(queryString, #char '&');
    for (paramPair in params) {
      let pairParts = Text.split(paramPair, #char '=');
      var key = "";
      var value = "";
      var j = 0;
      for (part in pairParts) {
        if (j == 0) { key := part };
        if (j == 1) { value := part };
        j += 1;
      };
      if (key == param) { return ?value };
    };
    
    default
  };

  // Helper function to extract tournament ID from path
  func getTournamentIdFromPath(path : Text) : Text {
    // Extract tournament ID from path like "/tournament/bracket/tour123"
    let parts = Text.split(path, #char '/');
    var tournamentId = "";
    var foundTournament = false;
    for (part in parts) {
      if (foundTournament and part != "") {
        tournamentId := part;
        return tournamentId;
      };
      if (part == "bracket" or part == "state") {
        foundTournament := true;
      };
    };
    tournamentId
  };

  // JSON serialization for bracket details
  func bracketDetailsToJson(details : {
    status : Text;
    currentRound : Nat;
    totalRounds : Nat;
    participants : [Address];
    bracketPositions : [(Address, ?ChallengeId, ?Address)];
    matchesByRound : [[{
      challengeId : ChallengeId;
      player1 : Address;
      player2 : Address;
      winner : ?Address;
      status : Text;
    }]];
    winners : [Address];
  }) : Text {
    var json = "{";
    json := json # "\"status\":\"" # details.status # "\",";
    json := json # "\"currentRound\":" # Nat.toText(details.currentRound) # ",";
    json := json # "\"totalRounds\":" # Nat.toText(details.totalRounds) # ",";
    
    // Participants array
    json := json # "\"participants\":[";
    var first = true;
    for (participant in details.participants.vals()) {
      if (not first) { json := json # "," };
      json := json # "\"" # participant # "\"";
      first := false;
    };
    json := json # "],";
    
    // Bracket positions
    json := json # "\"bracketPositions\":[";
    first := true;
    for (position in details.bracketPositions.vals()) {
      if (not first) { json := json # "," };
      let (player, challengeId, winner) = position;
      json := json # "{";
      json := json # "\"player\":\"" # player # "\",";
      json := json # "\"challengeId\":" # (switch (challengeId) { case (?id) "\"" # id # "\""; case null "null" }) # ",";
      json := json # "\"winner\":" # (switch (winner) { case (?w) "\"" # w # "\""; case null "null" });
      json := json # "}";
      first := false;
    };
    json := json # "],";
    
    // Matches by round
    json := json # "\"matchesByRound\":[";
    first := true;
    for (round in details.matchesByRound.vals()) {
      if (not first) { json := json # "," };
      json := json # "[";
      var firstMatch = true;
      for (match in round.vals()) {
        if (not firstMatch) { json := json # "," };
        json := json # "{";
        json := json # "\"challengeId\":\"" # match.challengeId # "\",";
        json := json # "\"player1\":\"" # match.player1 # "\",";
        json := json # "\"player2\":\"" # match.player2 # "\",";
        json := json # "\"winner\":" # (switch (match.winner) { case (?w) "\"" # w # "\""; case null "null" }) # ",";
        json := json # "\"status\":\"" # match.status # "\"";
        json := json # "}";
        firstMatch := false;
      };
      json := json # "]";
      first := false;
    };
    json := json # "],";
    
    // Winners array
    json := json # "\"winners\":[";
    first := true;
    for (winner in details.winners.vals()) {
      if (not first) { json := json # "," };
      json := json # "\"" # winner # "\"";
      first := false;
    };
    json := json # "]";
    
    json # "}"
  };

  // JSON serialization for bracket state
  func tournamentBracketStateToJson(state : {
    status : Text;
    currentRound : Nat;
    totalRounds : Nat;
    participants : [Address];
    winners : [Address];
    seeds : [(Address, Nat)];
  }) : Text {
    var json = "{";
    json := json # "\"status\":\"" # state.status # "\",";
    json := json # "\"currentRound\":" # Nat.toText(state.currentRound) # ",";
    json := json # "\"totalRounds\":" # Nat.toText(state.totalRounds) # ",";
    
    // Participants array
    json := json # "\"participants\":[";
    var first = true;
    for (participant in state.participants.vals()) {
      if (not first) { json := json # "," };
      json := json # "\"" # participant # "\"";
      first := false;
    };
    json := json # "],";
    
    // Winners array
    json := json # "\"winners\":[";
    first := true;
    for (winner in state.winners.vals()) {
      if (not first) { json := json # "," };
      json := json # "\"" # winner # "\"";
      first := false;
    };
    json := json # "],";
    
    // Seeds array
    json := json # "\"seeds\":[";
    first := true;
    for (seed in state.seeds.vals()) {
      if (not first) { json := json # "," };
      json := json # "{\"player\":\"" # seed.0 # "\",\"seed\":" # Nat.toText(seed.1) # "}";
      first := false;
    };
    json := json # "]";
    
    json # "}"
  };

  // Enhanced bracket generation with seeding and byes
  public func generateTournamentBracket(id : TournamentId, seeding : ?[(Address, Nat)]) : async Bool {
    let parts = switch (tournamentParticipants.get(id)) { case (?xs) xs; case null [] };
    if (parts.size() < 2) { return false };
    
    // Create seeded participant list if seeding provided
    var seededParticipants : [Address] = [];
    var seedMapping : [(Address, Nat)] = [];
    
    switch (seeding) {
      case (?seeds) {
        // Sort by seed (lower seed number = higher rank)
        let sortedSeeds = Array.sort<(Address, Nat)>(seeds, func(a, b) { if (a.1 < b.1) { #less } else if (a.1 > b.1) { #greater } else { #equal } });
        seedMapping := sortedSeeds;
        
        for (seed in sortedSeeds.vals()) {
          seededParticipants := Array.append<Address>(seededParticipants, [seed.0]);
        };
        // Add any unseeded participants at the end
        for (part in parts.vals()) {
          var found = false;
          for (seed in sortedSeeds.vals()) {
            if (seed.0 == part) { found := true; }
          };
          if (not found) {
            seededParticipants := Array.append<Address>(seededParticipants, [part]);
          };
        };
      };
      case null {
        seededParticipants := parts;
        // Assign default seeds based on registration order
        for (i in Iter.range(0, parts.size() - 1)) {
          seedMapping := Array.append<(Address, Nat)>(seedMapping, [(parts[i], i + 1)]);
        };
      };
    };
    
    // Store seed mapping for future reference
    tournamentBracketSeeds.put(id, seedMapping);
    
    // Calculate bracket size (next power of 2)
    var bracketSize = 1;
    while (bracketSize < seededParticipants.size()) {
      bracketSize := bracketSize * 2;
    };
    
    // Calculate number of byes needed
    let byesNeeded = bracketSize - seededParticipants.size();
    
    // Create bracket positions with enhanced tracking
    var bracketPositions : [(Address, ?ChallengeId, ?Address)] = [];
    var progressionMapping : [(Nat, Nat, Nat)] = []; // (round, position, nextRoundPosition)
    
    // Place seeded participants strategically to avoid early matchups
    let positions = calculateBracketPositions(seededParticipants.size(), bracketSize);
    
    for (pos in positions.vals()) {
      if (pos < seededParticipants.size()) {
        bracketPositions := Array.append<(Address, ?ChallengeId, ?Address)>(bracketPositions, [(seededParticipants[pos], null, null)]);
      } else {
        bracketPositions := Array.append<(Address, ?ChallengeId, ?Address)>(bracketPositions, [("", null, null)]); // Placeholder for bye
      };
    };
    
    // Calculate progression mapping for bracket visualization
    let totalRounds = if (bracketSize > 1) {
      var rounds = 0;
      var players = bracketSize;
      while (players > 1) {
        players := players / 2 + (players % 2);
        rounds := rounds + 1;
      };
      rounds
    } else { 0 };
    
    for (round in Iter.range(0, totalRounds - 2)) {
      let positionsInRound = bracketSize / (2 ** round);
      let nextRoundPositions = positionsInRound / 2;
      for (pos in Iter.range(0, positionsInRound - 1)) {
        let nextRoundPos = pos / 2;
        progressionMapping := Array.append<(Nat, Nat, Nat)>(progressionMapping, [(round, pos, nextRoundPos)]);
      };
    };
    
    tournamentBracket.put(id, seededParticipants);
    tournamentBracketPositions.put(id, bracketPositions);
    tournamentBracketProgression.put(id, progressionMapping);
    true
  };

  // Calculate optimal bracket positions to avoid early seed matchups
  func calculateBracketPositions(participantCount : Nat, bracketSize : Nat) : [Nat] {
    var positions : [Nat] = [];
    
    if (participantCount <= 2) {
      return Array.tabulate<Nat>(participantCount, func(i) { i });
    };
    
    // Use standard tournament seeding algorithm
    // Place highest seeds at positions that won't meet until later rounds
    let halfSize = bracketSize / 2;
    
    // Place seeds 1 and 2 at opposite ends
    if (participantCount >= 1) { positions := Array.append<Nat>(positions, [0]) };
    if (participantCount >= 2) { positions := Array.append<Nat>(positions, [halfSize]) };
    
    // Place remaining seeds using recursive pattern
    var remainingPositions = calculateBracketPositions(participantCount - 2, halfSize);
    for (pos in remainingPositions.vals()) {
      if (pos < halfSize - 1) {
        positions := Array.append<Nat>(positions, [pos + 1]);
        positions := Array.append<Nat>(positions, [halfSize + pos + 1]);
      };
    };
    
    // Trim to actual participant count
    Array.tabulate<Nat>(participantCount, func(i) { positions[i] })
  };

  // Get detailed bracket state for visualization
  public query func getTournamentBracketDetails(id : TournamentId) : async ?{
    status : Text;
    currentRound : Nat;
    totalRounds : Nat;
    participants : [Address];
    bracketPositions : [(Address, ?ChallengeId, ?Address)];
    matchesByRound : [[{
      challengeId : ChallengeId;
      player1 : Address;
      player2 : Address;
      winner : ?Address;
      status : Text;
    }]];
    winners : [Address];
  } {
    switch (tournaments.get(id)) {
      case null null;
      case (?t) {
        let participants = switch (tournamentParticipants.get(id)) { case (?xs) xs; case null [] };
        let winners = switch (tournamentWinners.get(id)) { case (?xs) xs; case null [] };
        let rounds = switch (tournamentRounds.get(id)) { case (?xs) xs; case null [] };
        let bracketPositions = switch (tournamentBracketPositions.get(id)) { case (?xs) xs; case null [] };
        
        // Build detailed matches by round
        var matchesByRound : [[{
          challengeId : ChallengeId;
          player1 : Address;
          player2 : Address;
          winner : ?Address;
          status : Text;
        }]] = [];
        
        for (roundMatches in rounds.vals()) {
          var roundDetails : [{
            challengeId : ChallengeId;
            player1 : Address;
            player2 : Address;
            winner : ?Address;
            status : Text;
          }] = [];
          
          for (challengeId in roundMatches.vals()) {
            switch (challenges.get(challengeId)) {
              case (?challenge) {
                let participants = switch (challengeParticipants.get(challengeId)) { case (?xs) xs; case null [] };
                let player1 = if (participants.size() > 0) { participants[0] } else { "" };
                let player2 = if (participants.size() > 1) { participants[1] } else { "" };
                
                // Check if there's a settlement for this challenge to determine winner
                let settlementWinner = switch (settlementsCh.get(challengeId)) {
                  case (?s) ?s.winner;
                  case null null;
                };
                
                roundDetails := Array.append(roundDetails, [{
                  challengeId = challengeId;
                  player1 = player1;
                  player2 = player2;
                  winner = settlementWinner;
                  status = if (settlementWinner != null) { "completed" } else { "pending" };
                }]);
              };
              case null {};
            };
          };
          
          matchesByRound := Array.append(matchesByRound, [roundDetails]);
        };
        
        ?{
          status = switch (t.status) {
            case (0) "cancelled";
            case (1) "open";
            case (2) "in_progress";
            case (3) "completed";
            case (_) "unknown";
          };
          currentRound = rounds.size();
          totalRounds = if (participants.size() > 1) { 
            var rounds = 0;
            var players = participants.size();
            while (players > 1) {
              players := players / 2 + (players % 2);
              rounds := rounds + 1;
            };
            rounds
          } else { 0 };
          participants = participants;
          bracketPositions = bracketPositions;
          matchesByRound = matchesByRound;
          winners = winners;
        }
      };
    }
  };

  type ChallengeInfo = {
    challengeType : Nat;
    status : Nat;
    creator : Address;
    opponent : Address;
    entryFee : Nat;
    totalPrizePool : Nat;
    createdAt : Nat64;
    currentParticipants : Nat;
    player1score : Nat;
    player2score : Nat;
    scoreReporter : Address;
    timeScored : Nat64;
    timeScoreConfirmed : Nat64;
    gameType : Text;
    metadata : Text;
    tournament : TournamentId;
    payToken : Text;
    contractBalance : Nat;
    expiresAt : Nat64; // Challenge expiration timestamp
    autoResolveThreshold : Nat64; // Time after expiration for auto-resolution (seconds)
    // ── New product fields (gamerholic_new) ──
    title : Text;
    console : Text;
    scheduledAt : Nat64; // 0 = unscheduled
    betable : Bool;
    marketId : Text;
    monitor : Address;
    creatorStream : Text;
    opponentStream : Text;
    scoreIsFinal : Bool;
    cancelRequester : Address; // "" = none pending
    cancelRequestedAt : Nat64;
    disputeVideo : Text;
    disputeReason : Text;
    disputeBy : Address;
  };

  type Gamer = { 
    wallet : Address; 
    username : Text; 
    avatarUrl : Text;
    baseRake : Nat; // Base rake percentage (8% default)
    totalGamesPlayed : Nat;
    totalTournamentsHosted : Nat;
    disputeWinRate : Nat; // Percentage * 100 (e.g., 750 = 75%)
    upvotes : Nat;
    penaltyMultiplier : Nat; // Current penalty multiplier (1 = no penalty)
    wins : Nat;
    losses : Nat;
    currentWinStreak : Nat;
    currentLossStreak : Nat;
    longestWinStreak : Nat;
    longestLossStreak : Nat;
    gameRecords : [(Text, { wins : Nat; losses : Nat; winStreak : Nat; lossStreak : Nat })]; // Per-game records
    // Earnings tracking
    totalHeadsUpEarnings : Nat; // Total earnings from heads-up challenges
    totalHeadsUpLosses : Nat; // Total losses from heads-up challenges (entry fees paid)
    totalTournamentEarnings : Nat; // Total earnings from tournaments
    totalTournamentLosses : Nat; // Total losses from tournaments (entry fees paid)
    tournamentWins : Nat; // Number of tournaments won
    tournamentLosses : Nat; // Number of tournaments lost
    // Per-token earnings tracking
    earningsByToken : [(Text, { headsUpEarnings : Nat; headsUpLosses : Nat; tournamentEarnings : Nat; tournamentLosses : Nat })];
  };
  
  type ModeratorRole = {
    #BaseReferee;     // Can referee and make dispute decisions
    #VettedMod;       // Can create paid tournaments; after quota, create free tournaments
    #SuperMod;        // Can set daily min bet once/day; set ladder thresholds every 90 days
    #AdminMod;        // Merch admin; can assign other admin mods (assigned by deployer)
  };
  
  type Moderator = {
    wallet : Address;
    role : ModeratorRole;
    appointedAt : Nat64;
    gamesRefereed : Nat;
    disputesResolved : Nat;
    upvotesReceived : Nat;
    lastPromotion : Nat64;
  };
  
  type Ruleset = { id : Nat; title : Text; settings : Text; votes : Nat; official : Bool };
  type Penalty = { surchargeUntil : Nat64; multiplier : Nat };
  type Vote = { moderator : Address; winner : Address; weight : Nat };
  type DisputeStatus = {
    #Active;
    #Resolved; 
    #Cancelled;
  };
  
  type Dispute = {
    challengeId : ChallengeId;
    disputedBy : Address;
    disputedAt : Nat64;
    status : DisputeStatus;
    votes : [Vote];
    expiresAt : Nat64;
  };

  // Room types for group play challenges
  type RoomId = Text;
  
  type RoomInfo = {
    id : RoomId;
    name : Text;
    creator : Address;
    description : Text;
    gameTypes : [Text];
    console : Text;
    rules : Text;
    imageUrl : Text;
    members : [Address];
    memberCount : Nat;
    createdAt : Nat64;
    isActive : Bool;
  };
  
  type RoomChallengeInfo = {
    id : ChallengeId;
    roomId : RoomId;
    creator : Address;
    roomCreator : Address;
    gameType : Text;
    console : Text;
    maxPlayers : Nat;
    entryFee : Nat;
    payToken : Text;
    rules : Text;
    participants : [Address];
    participantCount : Nat;
    status : Nat;
    startedAt : Nat64;
    completedAt : Nat64;
    winner : Address;
    prizePool : Nat;
    createdAt : Nat64;
    payoutTxId : Text;
    payoutAmount : Nat;
    platformFeeAmount : Nat;
    roomHostFeeAmount : Nat;
    treasuryAmount : Nat;
    payoutTimestamp : Nat64;
  };
  
  // Room player statistics - tracks performance per room
  type RoomPlayerStats = {
    roomId : RoomId;
    player : Address;
    gamesPlayed : Nat;
    wins : Nat;
    losses : Nat;
    totalEarnings : Nat;  // Net winnings (won - lost)
    totalEntryFees : Nat; // Total entry fees paid
    totalPayouts : Nat;   // Total payouts received
    createdAt : Nat64;
    lastPlayed : Nat64;
  };
  
  // Global room leaderboard entry
  type RoomLeaderboardEntry = {
    player : Address;
    totalRooms : Nat;           // Number of rooms player is/was in
    totalGamesPlayed : Nat;
    totalWins : Nat;
    totalLosses : Nat;
    totalEarnings : Nat;
    winRate : Nat;              // Percentage (0-100)
    lastActive : Nat64;
  };

  type Settlement = {
    pot : Nat;
    rakePercent : Nat;
    rake : Nat;
    winner : Address;
    claimed : Bool;
  };

  // Policy
  transient var platformFeeRate : Nat = 4;
  transient var minimumEntryFee : Nat = 0;
  transient var feeRecipient : Address = "";

  transient var settlementIdCounter : Nat = 0;

  // Admin
  transient var admins = HashMap.HashMap<Address, Bool>(16, Text.equal, Text.hash);

  // Games & Rules
  transient var games = HashMap.HashMap<Text, Bool>(256, Text.equal, Text.hash);
  transient var officialGames = HashMap.HashMap<Text, Bool>(128, Text.equal, Text.hash);
  transient var gameMetadata = HashMap.HashMap<Text, { name : Text; description : Text; category : Text; createdBy : Address; createdAt : Nat64 }>(256, Text.equal, Text.hash);
  transient var gameModerators = HashMap.HashMap<Text, [Address]>(256, Text.equal, Text.hash);
  transient var rulesByGame = HashMap.HashMap<Text, [Ruleset]>(256, Text.equal, Text.hash);
  transient var minBetByGame = HashMap.HashMap<Text, Nat>(128, Text.equal, Text.hash);
  transient var lastMinBetUpdate = HashMap.HashMap<Text, Nat64>(128, Text.equal, Text.hash);

  // Moderators
  transient var moderators = HashMap.HashMap<Address, Moderator>(256, Text.equal, Text.hash);

  // Gamers
  transient var gamers = HashMap.HashMap<Address, Gamer>(1024, Text.equal, Text.hash);
  // Gamer extended profile metadata (JSON text)
  transient var gamerProfileMeta = HashMap.HashMap<Address, Text>(1024, Text.equal, Text.hash);

  // Disputes
  transient var disputes = HashMap.HashMap<ChallengeId, Dispute>(512, Text.equal, Text.hash);
  transient var penalties = HashMap.HashMap<Address, Penalty>(512, Text.equal, Text.hash);

  // Tournaments
  transient var tournaments = HashMap.HashMap<TournamentId, TournamentInfo>(256, Text.equal, Text.hash);
  transient var tournamentParticipants = HashMap.HashMap<TournamentId, [Address]>(256, Text.equal, Text.hash);
  transient var tournamentActives = HashMap.HashMap<TournamentId, [Address]>(256, Text.equal, Text.hash);
  transient var tournamentHosts = HashMap.HashMap<TournamentId, Address>(256, Text.equal, Text.hash);
  transient var tournamentBracket = HashMap.HashMap<TournamentId, [Address]>(256, Text.equal, Text.hash);
  transient var tournamentWinners = HashMap.HashMap<TournamentId, [Address]>(256, Text.equal, Text.hash);
  transient var tournamentChildEscrows = HashMap.HashMap<TournamentId, [ChallengeId]>(256, Text.equal, Text.hash);
  
  // Tournament audit and refund tracking
  transient var tournamentRefunds = HashMap.HashMap<TournamentId, [TournamentRefundLog]>(256, Text.equal, Text.hash);
  transient var moderatorActions = HashMap.HashMap<TournamentId, [ModeratorActionLog]>(256, Text.equal, Text.hash);

  // Team functionality data structures
  transient var teams = HashMap.HashMap<TeamId, TeamInfo>(256, Text.equal, Text.hash);
  transient var teamMembers = HashMap.HashMap<TeamId, [Address]>(256, Text.equal, Text.hash);
  /** Team prize split: member → bps of team pool (must total 10000 when claiming) */
  transient var teamWinSplits = HashMap.HashMap<TeamId, [TeamMemberSplit]>(256, Text.equal, Text.hash);
  transient var teamInvitations = HashMap.HashMap<Address, [TeamInvitation]>(256, Text.equal, Text.hash); // invitee -> invitations
  transient var playerTeams = HashMap.HashMap<Address, TeamId>(256, Text.equal, Text.hash); // player -> team
  transient var teamTournaments = HashMap.HashMap<TeamId, [TournamentId]>(256, Text.equal, Text.hash); // team -> tournaments participated
  /** Winning team recorded at claim time for team-entry tournaments */
  transient var tournamentWinningTeam = HashMap.HashMap<TournamentId, TeamId>(128, Text.equal, Text.hash);

  // Challenges
  transient var challenges = HashMap.HashMap<ChallengeId, ChallengeInfo>(1024, Text.equal, Text.hash);
  transient var challengeParticipants = HashMap.HashMap<ChallengeId, [Address]>(1024, Text.equal, Text.hash);

  /// entityId (tournament or challenge) → betable market settled flag (claim gate)
  transient let betableSettledByEntity = HashMap.HashMap<Text, Bool>(64, Text.equal, Text.hash);

  // Rooms functionality data structures
  transient var rooms = HashMap.HashMap<RoomId, RoomInfo>(256, Text.equal, Text.hash);
  transient var roomChallenges = HashMap.HashMap<RoomId, [ChallengeId]>(256, Text.equal, Text.hash);
  transient var roomChallengeInfo = HashMap.HashMap<ChallengeId, RoomChallengeInfo>(256, Text.equal, Text.hash);
  
  // Room player statistics storage
  transient var roomPlayerStats = HashMap.HashMap<Text, RoomPlayerStats>(1024, Text.equal, Text.hash); // "roomId:player" -> stats
  transient var playerRoomStats = HashMap.HashMap<Address, [RoomId]>(256, Text.equal, Text.hash); // player -> list of rooms they've played in
  transient var roomLeaderboard = HashMap.HashMap<Address, RoomLeaderboardEntry>(256, Text.equal, Text.hash); // player -> global leaderboard entry

  // Immutable Treasury Pattern - Track fund movements through ledger rather than state
  type TreasuryTransaction = {
    id : Text;
    timestamp : Nat64;
    transactionType : {
      #Deposit; #Withdrawal; #RakeCollection; #PrizeDistribution; #PlatformFee; #TreasuryAllocation;
    };
    tokenType : Text;
    amount : Nat;
    fromAddress : ?Text;
    toAddress : ?Text;
    challengeId : ?ChallengeId;
    tournamentId : ?TournamentId;
    description : Text;
  };
  
  // Treasury transaction history (immutable ledger)
  transient let treasuryTransactions = HashMap.HashMap<Text, TreasuryTransaction>(1024, Text.equal, Text.hash);
  transient let treasuryTransactionList = Buffer.Buffer<TreasuryTransaction>(1024);

  // Tournament refund and moderator action logs for audit trail
  type TournamentRefundLog = {
    tournamentId : TournamentId;
    moderator : Address;
    refundAmount : Nat;
    refundToken : Text;
    refundReason : Text;
    timestamp : Nat64;
    participantsRefunded : [Address];
    totalRefunded : Nat;
  };

  type ModeratorActionLog = {
    tournamentId : TournamentId;
    moderator : Address;
    actionType : {
      #Cancel; #Disqualify; #Refund; #ExtendDeadline; #ForceAdvance;
    };
    actionReason : Text;
    timestamp : Nat64;
    affectedPlayers : [Address];
    metadata : Text;
  };

  // Ledger integration
  type HttpRequest = {
    url : Text;
    method : Text;
    headers : [(Text, Text)];
    body : Blob;
  };

  type HttpResponse = {
    status_code : Nat16;
    headers : [(Text, Text)];
    body : [Nat8];
    upgrade : ?Bool;
    streaming_strategy : ?{
      #Callback : {
        callback : shared query () -> async {
          #Chunk : { body : [Nat8]; token : ?() };
          #LastChunk : { body : [Nat8] };
        };
        token : ?();
      };
    };
  };

  // Supported token types with their ledger canister IDs
  type TokenInfo = {
    name: Text;
    symbol: Text;
    decimals: Nat8;
    ledger: Principal;
    fee: Nat;
  };
  
  transient let supportedTokens = HashMap.HashMap<Text, TokenInfo>(10, Text.equal, Text.hash);
  
  // Initialize supported tokens
  // WICP (Wrapped ICP) as PRIMARY currency - ICRC-2 approve + pull model
  transient let wicpLedgerPrincipal = Principal.fromText("5xnja-6aaaa-aaaan-qad4a-cai"); // WICP mainnet
  var icpLedgerPrincipal = Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai"); // Native ICP (legacy support)
  transient let ckBTCLedger = Principal.fromText("mxzaz-hqaaa-aaaar-qaada-cai"); // ckBTC ledger
  transient let ckETHLedger = Principal.fromText("ss2fx-dyaaa-aaaar-qacoq-cai"); // ckETH ledger
  transient let xtcLedger = Principal.fromText("aanaa-xaaaa-aaaah-aaeiq-cai"); // XTC ledger
  
  // WICP is now the primary token for all operations
  supportedTokens.put("WICP", { name = "Wrapped ICP"; symbol = "WICP"; decimals = 8; ledger = wicpLedgerPrincipal; fee = 10_000 });
  supportedTokens.put("ICP", { name = "Internet Computer"; symbol = "ICP"; decimals = 8; ledger = icpLedgerPrincipal; fee = 10_000 });
  supportedTokens.put("ckBTC", { name = "Chain-key Bitcoin"; symbol = "ckBTC"; decimals = 8; ledger = ckBTCLedger; fee = 10 });
  supportedTokens.put("ckETH", { name = "Chain-key Ethereum"; symbol = "ckETH"; decimals = 18; ledger = ckETHLedger; fee = 2_000_000_000_000 });
  supportedTokens.put("XTC", { name = "Cycles"; symbol = "XTC"; decimals = 12; ledger = xtcLedger; fee = 1_000_000_000_000 });
  
  
  transient let icrcLedgers = HashMap.HashMap<Text, actor {
    icrc1_balance_of: query { owner: Principal; subaccount: ?[Nat8] } -> async Nat;
    icrc1_transfer: shared { from_subaccount: ?[Nat8]; to: { owner: Principal; subaccount: ?[Nat8] }; amount: Nat; fee: ?Nat; memo: ?Blob; created_at_time: ?Nat64 } -> async { Ok: Nat; Err: Text };
    icrc2_transfer_from: shared {
      from: { owner: Principal; subaccount: ?[Nat8] };
      to: { owner: Principal; subaccount: ?[Nat8] };
      amount: Nat;
      fee: ?Nat;
      memo: ?Blob;
      created_at_time: ?Nat64;
      spender_subaccount: ?[Nat8]
    } -> async { Ok: Nat; Err: Text };
  }>(10, Text.equal, Text.hash);

  func ensureIcrcLedgerActor(tokenId : Text) {
    switch (icrcLedgers.get(tokenId)) {
      case (?a) { };
      case null {
        switch (supportedTokens.get(tokenId)) {
          case (?info) {
            let a = actor (Principal.toText(info.ledger)) : actor {
              icrc1_balance_of: query { owner: Principal; subaccount: ?[Nat8] } -> async Nat;
              icrc1_transfer: shared { from_subaccount: ?[Nat8]; to: { owner: Principal; subaccount: ?[Nat8] }; amount: Nat; fee: ?Nat; memo: ?Blob; created_at_time: ?Nat64 } -> async { Ok: Nat; Err: Text };
              icrc2_transfer_from: shared {
                from: { owner: Principal; subaccount: ?[Nat8] };
                to: { owner: Principal; subaccount: ?[Nat8] };
                amount: Nat;
                fee: ?Nat;
                memo: ?Blob;
                created_at_time: ?Nat64;
                spender_subaccount: ?[Nat8]
              } -> async { Ok: Nat; Err: Text };
            };
            icrcLedgers.put(tokenId, a);
          };
          case null { };
        };
      };
    };
  };

  func icpLedgerActor() : actor {
    account_balance: query { account: [Nat8] } -> async { e8s: Nat64 };
    transfer: shared { to: [Nat8]; amount: { e8s: Nat64 }; fee: { e8s: Nat64 }; memo: Nat64; from_subaccount: ?[Nat8]; created_at_time: ?Nat64 } -> async { Ok: Nat64; Err: { error_type: Text; } };
  } {
    actor (Principal.toText(icpLedgerPrincipal)) : actor {
      account_balance: query { account: [Nat8] } -> async { e8s: Nat64 };
      transfer: shared { to: [Nat8]; amount: { e8s: Nat64 }; fee: { e8s: Nat64 }; memo: Nat64; from_subaccount: ?[Nat8]; created_at_time: ?Nat64 } -> async { Ok: Nat64; Err: { error_type: Text; } };
    }
  };
  
  // ICRC-1 ledger actor for native ICP with subaccounts
  func icrc1LedgerActor() : actor {
    icrc1_balance_of: query { owner: Principal; subaccount: ?Blob } -> async Nat;
    icrc1_transfer: shared {
      from_subaccount: ?Blob;
      to: { owner: Principal; subaccount: ?Blob };
      amount: Nat;
      fee: ?Nat;
      memo: ?Blob;
      created_at_time: ?Nat64;
    } -> async { #Ok: Nat; #Err: Text };
  } {
    actor (Principal.toText(icpLedgerPrincipal)) : actor {
      icrc1_balance_of: query { owner: Principal; subaccount: ?Blob } -> async Nat;
      icrc1_transfer: shared {
        from_subaccount: ?Blob;
        to: { owner: Principal; subaccount: ?Blob };
        amount: Nat;
        fee: ?Nat;
        memo: ?Blob;
        created_at_time: ?Nat64;
      } -> async { #Ok: Nat; #Err: Text };
    }
  };

  public func setIcpLedgerPrincipal(p : Principal) : async Bool {
    icpLedgerPrincipal := p;
    supportedTokens.put("ICP", { name = "Internet Computer"; symbol = "ICP"; decimals = 8; ledger = p; fee = 10_000 });
    true
  };

  // Set WICP ledger principal (primary currency)
  public func setWicpLedgerPrincipal(p : Principal) : async Bool {
    supportedTokens.put("WICP", { name = "Wrapped ICP"; symbol = "WICP"; decimals = 8; ledger = p; fee = 10_000 });
    true
  };

  // ============================================================================
  // NATIVE ICP SUBACCOUNT SYSTEM
  // ============================================================================
  
  // Subaccount helper functions for native ICP transfers
  // Each user gets a deterministic subaccount derived from their principal
  // Each challenge/tournament/room gets a unique subaccount derived from its ID
  
  // Derive 32-byte subaccount from principal (for user deposits)
  private func subaccountForPrincipal(p : Principal) : Blob {
    let pb = Blob.toArray(Principal.toBlob(p));
    let out = Array.tabulate<Nat8>(32, func(i) {
      if (i < pb.size()) { pb[i] } else { 0 }
    });
    Blob.fromArray(out)
  };
  
  // Derive subaccount from challenge ID (for heads-up challenge prize pools)
  private func subaccountForChallenge(challengeId : Text) : Blob {
    let arr = Blob.toArray(Text.encodeUtf8(challengeId));
    let out = Array.tabulate<Nat8>(32, func(i) {
      if (i < arr.size()) { arr[i] } else { 0 }
    });
    Blob.fromArray(out)
  };
  
  // Derive subaccount from tournament ID (for tournament prize pools)
  private func subaccountForTournament(tournamentId : Text) : Blob {
    let arr = Blob.toArray(Text.encodeUtf8(tournamentId));
    let out = Array.tabulate<Nat8>(32, func(i) {
      if (i < arr.size()) { arr[i] } else { 0 }
    });
    Blob.fromArray(out)
  };
  
  // Derive subaccount from room ID (for room prize pools)
  private func subaccountForRoom(roomId : Text) : Blob {
    let arr = Blob.toArray(Text.encodeUtf8(roomId));
    let out = Array.tabulate<Nat8>(32, func(i) {
      if (i < arr.size()) { arr[i] } else { 0 }
    });
    Blob.fromArray(out)
  };
  
  // Platform fee destination principal (external wallet)
  private let platformFeePrincipal = Principal.fromText("73r5a-ogh4g-oidfj-v4yxg-kwjpb-jooaj-lsv3l-uv2pe-a6ffk-moasu-eae");
  
  // Derive subaccount for community vault (treasury)
  private func subaccountForTreasury() : Blob {
    let arr = Blob.toArray(Text.encodeUtf8("community_vault"));
    let out = Array.tabulate<Nat8>(32, func(i) {
      if (i < arr.size()) { arr[i] } else { 0 }
    });
    Blob.fromArray(out)
  };
  
  // ============================================================================
  // PUBLIC API: DEPOSIT ADDRESS GENERATION & BALANCE QUERIES
  // ============================================================================
  
  // Get user's deposit subaccount (for frontend to derive account ID)
  public query func getUserDepositSubaccount(caller : Principal) : async Blob {
    return subaccountForPrincipal(caller);
  };
  
  // Get challenge subaccount (for prize pool deposits)
  public query func getChallengeSubaccount(challengeId : Text) : async Blob {
    return subaccountForChallenge(challengeId);
  };
  
  // Get tournament subaccount (for prize pool deposits)
  public query func getTournamentSubaccount(tournamentId : Text) : async Blob {
    return subaccountForTournament(tournamentId);
  };
  
  // Get room subaccount (for prize pool deposits)
  public query func getRoomSubaccount(roomId : Text) : async Blob {
    return subaccountForRoom(roomId);
  };
  
  // Get user's ICP balance from their deposit subaccount
  public shared func getUserICPBalance(caller : Principal) : async Nat {
    let ledger = icrc1LedgerActor();
    let sub = subaccountForPrincipal(caller);
    let balance = await ledger.icrc1_balance_of({
      owner = Principal.fromActor(Gamerholic);
      subaccount = ?sub;
    });
    return balance;
  };
  
  // Get challenge prize pool balance (entry fees + additional contributions)
  public shared func getChallengePrizePool(challengeId : Text) : async Nat {
    let ledger = icrc1LedgerActor();
    let sub = subaccountForChallenge(challengeId);
    let balance = await ledger.icrc1_balance_of({
      owner = Principal.fromActor(Gamerholic);
      subaccount = ?sub;
    });
    return balance;
  };
  
  // Get tournament prize pool balance (entry fees + additional contributions)
  public shared func getTournamentPrizePool(tournamentId : Text) : async Nat {
    let ledger = icrc1LedgerActor();
    let sub = subaccountForTournament(tournamentId);
    let balance = await ledger.icrc1_balance_of({
      owner = Principal.fromActor(Gamerholic);
      subaccount = ?sub;
    });
    return balance;
  };
  
  // Get room prize pool balance (entry fees + additional contributions)
  public shared func getRoomPrizePool(roomId : Text) : async Nat {
    let ledger = icrc1LedgerActor();
    let sub = subaccountForRoom(roomId);
    let balance = await ledger.icrc1_balance_of({
      owner = Principal.fromActor(Gamerholic);
      subaccount = ?sub;
    });
    return balance;
  };
  
  // Withdraw ICP from user's deposit subaccount to their principal
  public shared({ caller }) func withdrawICP(amount : Nat, toPrincipal : Principal) : async { ok : Bool; err : Text } {
    // Validate destination looks like a principal (must contain dashes)
    let destText = Principal.toText(toPrincipal);
    if (not Text.contains(destText, #text "-")) {
      return { ok = false; err = "Invalid destination. Please enter a principal ID (e.g., abcde-xyz...)" };
    };
    
    let ledger = icrc1LedgerActor();
    let sub = subaccountForPrincipal(caller);
    
    // Check user's balance
    let balance = await ledger.icrc1_balance_of({
      owner = Principal.fromActor(Gamerholic);
      subaccount = ?sub;
    });
    
    let fee : Nat = 10_000; // ICP transfer fee
    
    if (amount > balance) {
      return { ok = false; err = "Insufficient balance" };
    };
    
    if (amount <= fee) {
      return { ok = false; err = "Amount must exceed transfer fee (0.0001 ICP)" };
    };
    
    // Transfer from user's subaccount to destination principal
    let result = await ledger.icrc1_transfer({
      from_subaccount = ?sub;
      to = { owner = toPrincipal; subaccount = null };
      amount = amount - fee;
      fee = ?fee;
      memo = null;
      created_at_time = null;
    });
    
    switch (result) {
      case (#Ok(_)) {
        return { ok = true; err = "" };
      };
      case (#Err(e)) {
        return { ok = false; err = "Transfer failed: " # e };
      };
    };
  };
  
  // ============================================================================
  // NATIVE ICP ENTRY FEE DEBIT FUNCTIONS
  // ============================================================================
  
  // Debit challenge entry fee from user's deposit subaccount to challenge subaccount (escrow)
  public shared({ caller }) func debitChallengeEntryFeeNativeICP(challengeId : ChallengeId, amount : Nat) : async Bool {
    let ledger = icrc1LedgerActor();
    let userSub = subaccountForPrincipal(caller);
    let challengeSub = subaccountForChallenge(challengeId);
    
    // Check user's balance
    let balance = await ledger.icrc1_balance_of({
      owner = Principal.fromActor(Gamerholic);
      subaccount = ?userSub;
    });
    
    let fee : Nat = 10_000; // ICP transfer fee
    
    if (balance < amount + fee) {
      return false;
    };
    
    // Transfer from user's deposit subaccount to challenge subaccount (escrow)
    let result = await ledger.icrc1_transfer({
      from_subaccount = ?userSub;
      to = { owner = Principal.fromActor(Gamerholic); subaccount = ?challengeSub };
      amount = amount;
      fee = ?fee;
      memo = ?Text.encodeUtf8("Challenge entry: " # challengeId);
      created_at_time = null;
    });
    
    switch (result) {
      case (#Ok(_)) {
        // Mark challenge as funded
        challengeFunding.put(challengeId, { 
          challengerFunded = true; 
          opponentFunded = switch (challengeFunding.get(challengeId)) { 
            case (?s) s.opponentFunded; 
            case null false 
          } 
        });
        return true;
      };
      case (#Err(_)) {
        return false;
      };
    };
  };
  
  // Debit tournament entry fee from user's deposit subaccount to tournament subaccount (escrow)
  public shared({ caller }) func debitTournamentEntryFeeNativeICP(tournamentId : TournamentId, amount : Nat) : async Bool {
    let ledger = icrc1LedgerActor();
    let userSub = subaccountForPrincipal(caller);
    let tournamentSub = subaccountForTournament(tournamentId);
    
    // Check user's balance
    let balance = await ledger.icrc1_balance_of({
      owner = Principal.fromActor(Gamerholic);
      subaccount = ?userSub;
    });
    
    let fee : Nat = 10_000; // ICP transfer fee
    
    if (balance < amount + fee) {
      return false;
    };
    
    // Transfer from user's deposit subaccount to tournament subaccount (escrow)
    let result = await ledger.icrc1_transfer({
      from_subaccount = ?userSub;
      to = { owner = Principal.fromActor(Gamerholic); subaccount = ?tournamentSub };
      amount = amount;
      fee = ?fee;
      memo = ?Text.encodeUtf8("Tournament entry: " # tournamentId);
      created_at_time = null;
    });
    
    switch (result) {
      case (#Ok(_)) {
        return true;
      };
      case (#Err(_)) {
        return false;
      };
    };
  };
  
  // Debit room challenge entry fee from user's deposit subaccount to room subaccount (escrow)
  public shared({ caller }) func debitRoomChallengeEntryFeeNativeICP(roomId : Text, challengeId : ChallengeId, amount : Nat) : async Bool {
    let ledger = icrc1LedgerActor();
    let userSub = subaccountForPrincipal(caller);
    let roomSub = subaccountForRoom(roomId);
    
    // Check user's balance
    let balance = await ledger.icrc1_balance_of({
      owner = Principal.fromActor(Gamerholic);
      subaccount = ?userSub;
    });
    
    let fee : Nat = 10_000; // ICP transfer fee
    
    if (balance < amount + fee) {
      return false;
    };
    
    // Transfer from user's deposit subaccount to room subaccount (escrow)
    let result = await ledger.icrc1_transfer({
      from_subaccount = ?userSub;
      to = { owner = Principal.fromActor(Gamerholic); subaccount = ?roomSub };
      amount = amount;
      fee = ?fee;
      memo = ?Text.encodeUtf8("Room challenge entry: " # challengeId);
      created_at_time = null;
    });
    
    switch (result) {
      case (#Ok(_)) {
        return true;
      };
      case (#Err(_)) {
        return false;
      };
    };
  };

  // ============================================================================
  // NATIVE ICP PRIZE PAYOUT FUNCTIONS WITH SPLIT TRANSFERS
  // ============================================================================

  // Distribute challenge prizes with fee splits (90% winner, 7% platform, 3% treasury)
  public shared({ caller }) func distributeChallengePrizeNativeICP(challengeId : ChallengeId, winnerPrincipal : Principal) : async { ok : Bool; err : Text; amount : Nat } {
    // Only admin or the canister itself can distribute prizes
    switch (admins.get(Principal.toText(caller))) {
      case (?true) {};
      case _ {
        if (caller != Principal.fromActor(Gamerholic)) {
          return { ok = false; err = "Unauthorized"; amount = 0 };
        };
      };
    };

    let ledger = icrc1LedgerActor();
    let challengeSub = subaccountForChallenge(challengeId);
    let fee : Nat = 10_000;

    // Get challenge subaccount balance (includes entry fees + any additional contributions)
    let balance = await ledger.icrc1_balance_of({
      owner = Principal.fromActor(Gamerholic);
      subaccount = ?challengeSub;
    });

    if (balance <= fee * 3) {
      return { ok = false; err = "Insufficient prize pool balance"; amount = 0 };
    };

    // Calculate fee splits (in basis points)
    let winnerBps : Nat = 9000; // 90%
    let platformBps : Nat = 700; // 7%
    let treasuryBps : Nat = 300; // 3%

    let winnerAmount = (balance * winnerBps) / 10000;
    let platformAmount = (balance * platformBps) / 10000;
    let treasuryAmount = (balance * treasuryBps) / 10000;

    var resultAmounts = { winner = 0 : Nat; platform = 0 : Nat; treasury = 0 : Nat };
    var successCount : Nat = 0;

    // Transfer to winner (90%)
    if (winnerAmount > fee) {
      let winnerSub = subaccountForPrincipal(winnerPrincipal);
      let result = await ledger.icrc1_transfer({
        from_subaccount = ?challengeSub;
        to = { owner = Principal.fromActor(Gamerholic); subaccount = ?winnerSub };
        amount = winnerAmount - fee;
        fee = ?fee;
        memo = ?Text.encodeUtf8("Challenge prize: " # challengeId);
        created_at_time = null;
      });
      switch (result) {
        case (#Ok(_)) {
          resultAmounts := { resultAmounts with winner = winnerAmount - fee };
          successCount += 1;
        };
        case (#Err(_)) {};
      };
    };

    // Transfer to platform (7%) - external wallet
    if (platformAmount > fee) {
      let result = await ledger.icrc1_transfer({
        from_subaccount = ?challengeSub;
        to = { owner = platformFeePrincipal; subaccount = null };
        amount = platformAmount - fee;
        fee = ?fee;
        memo = ?Text.encodeUtf8("Challenge platform fee: " # challengeId);
        created_at_time = null;
      });
      switch (result) {
        case (#Ok(_)) {
          resultAmounts := { resultAmounts with platform = platformAmount - fee };
          successCount += 1;
        };
        case (#Err(_)) {};
      };
    };

    // Transfer to treasury (3%) - community vault
    if (treasuryAmount > fee) {
      let treasurySub = subaccountForTreasury();
      let result = await ledger.icrc1_transfer({
        from_subaccount = ?challengeSub;
        to = { owner = Principal.fromActor(Gamerholic); subaccount = ?treasurySub };
        amount = treasuryAmount - fee;
        fee = ?fee;
        memo = ?Text.encodeUtf8("Challenge treasury fee: " # challengeId);
        created_at_time = null;
      });
      switch (result) {
        case (#Ok(_)) {
          resultAmounts := { resultAmounts with treasury = treasuryAmount - fee };
          successCount += 1;
        };
        case (#Err(_)) {};
      };
    };

    if (successCount > 0) {
      return { ok = true; err = ""; amount = resultAmounts.winner };
    } else {
      return { ok = false; err = "All transfers failed"; amount = 0 };
    };
  };

  // Distribute tournament prizes with fee splits (90% winners, 5% host, 4% platform, 1% treasury)
  public shared({ caller }) func distributeTournamentPrizesNativeICP(
    tournamentId : TournamentId,
    winners : [(Principal, Nat)], // Array of (winner principal, prize percentage in basis points of the 90% winner pool)
    hostPrincipal : Principal
  ) : async { ok : Bool; err : Text; transfers : Nat } {
    // Only admin can distribute tournament prizes
    switch (admins.get(Principal.toText(caller))) {
      case (?true) {};
      case _ return { ok = false; err = "Unauthorized"; transfers = 0 };
    };

    let ledger = icrc1LedgerActor();
    let tournamentSub = subaccountForTournament(tournamentId);
    let fee : Nat = 10_000;

    // Get tournament subaccount balance
    let balance = await ledger.icrc1_balance_of({
      owner = Principal.fromActor(Gamerholic);
      subaccount = ?tournamentSub;
    });

    if (balance <= fee * 4) {
      return { ok = false; err = "Insufficient prize pool balance"; transfers = 0 };
    };

    // Calculate fee splits (in basis points)
    let winnersBps : Nat = 9000; // 90% (split among winners)
    let hostBps : Nat = 500; // 5%
    let platformBps : Nat = 400; // 4%
    let treasuryBps : Nat = 100; // 1%

    let winnersPool = (balance * winnersBps) / 10000;
    let hostAmount = (balance * hostBps) / 10000;
    let platformAmount = (balance * platformBps) / 10000;
    let treasuryAmount = (balance * treasuryBps) / 10000;

    var transfersCompleted : Nat = 0;

    // Distribute prizes to each winner based on their percentage of the 90% pool
    for ((winnerPrincipal, percentageBps) in winners.vals()) {
      let winnerSub = subaccountForPrincipal(winnerPrincipal);
      let prizeAmount = (winnersPool * percentageBps) / 10000;

      if (prizeAmount > fee) {
        let netAmount = prizeAmount - fee;
        let result = await ledger.icrc1_transfer({
          from_subaccount = ?tournamentSub;
          to = { owner = Principal.fromActor(Gamerholic); subaccount = ?winnerSub };
          amount = netAmount;
          fee = ?fee;
          memo = ?Text.encodeUtf8("Tournament prize: " # tournamentId);
          created_at_time = null;
        });

        switch (result) {
          case (#Ok(_)) {
            transfersCompleted += 1;
          };
          case (#Err(_)) {};
        };
      };
    };

    // Transfer to host (5%)
    if (hostAmount > fee) {
      let hostSub = subaccountForPrincipal(hostPrincipal);
      let result = await ledger.icrc1_transfer({
        from_subaccount = ?tournamentSub;
        to = { owner = Principal.fromActor(Gamerholic); subaccount = ?hostSub };
        amount = hostAmount - fee;
        fee = ?fee;
        memo = ?Text.encodeUtf8("Tournament host fee: " # tournamentId);
        created_at_time = null;
      });
      switch (result) {
        case (#Ok(_)) {
          transfersCompleted += 1;
        };
        case (#Err(_)) {};
      };
    };

    // Transfer to platform (4%) - external wallet
    if (platformAmount > fee) {
      let result = await ledger.icrc1_transfer({
        from_subaccount = ?tournamentSub;
        to = { owner = platformFeePrincipal; subaccount = null };
        amount = platformAmount - fee;
        fee = ?fee;
        memo = ?Text.encodeUtf8("Tournament platform fee: " # tournamentId);
        created_at_time = null;
      });
      switch (result) {
        case (#Ok(_)) {
          transfersCompleted += 1;
        };
        case (#Err(_)) {};
      };
    };

    // Transfer to treasury (1%) - community vault
    if (treasuryAmount > fee) {
      let treasurySub = subaccountForTreasury();
      let result = await ledger.icrc1_transfer({
        from_subaccount = ?tournamentSub;
        to = { owner = Principal.fromActor(Gamerholic); subaccount = ?treasurySub };
        amount = treasuryAmount - fee;
        fee = ?fee;
        memo = ?Text.encodeUtf8("Tournament treasury fee: " # tournamentId);
        created_at_time = null;
      });
      switch (result) {
        case (#Ok(_)) {
          transfersCompleted += 1;
        };
        case (#Err(_)) {};
      };
    };

    return { ok = true; err = ""; transfers = transfersCompleted };
  };

  // Distribute room challenge prizes with fee splits (90% winner, 5% host, 4% platform, 1% treasury)
  public shared({ caller }) func distributeRoomChallengePrizeNativeICP(
    roomId : Text,
    challengeId : ChallengeId,
    winnerPrincipal : Principal,
    hostPrincipal : Principal
  ) : async { ok : Bool; err : Text; amounts : { winner : Nat; platform : Nat; host : Nat; treasury : Nat } } {
    // Only admin or room host can distribute room prizes
    switch (admins.get(Principal.toText(caller))) {
      case (?true) {};
      case _ {
        if (caller != hostPrincipal) {
          return { ok = false; err = "Unauthorized"; amounts = { winner = 0; platform = 0; host = 0; treasury = 0 } };
        };
      };
    };

    let ledger = icrc1LedgerActor();
    let roomSub = subaccountForRoom(roomId);
    let fee : Nat = 10_000;

    // Get room subaccount balance
    let balance = await ledger.icrc1_balance_of({
      owner = Principal.fromActor(Gamerholic);
      subaccount = ?roomSub;
    });

    if (balance <= fee * 4) {
      return { ok = false; err = "Insufficient prize pool balance"; amounts = { winner = 0; platform = 0; host = 0; treasury = 0 } };
    };

    // Calculate fee splits (in basis points)
    let winnerBps : Nat = 9000; // 90%
    let hostBps : Nat = 500; // 5%
    let platformBps : Nat = 400; // 4%
    let treasuryBps : Nat = 100; // 1%

    let winnerAmount = (balance * winnerBps) / 10000;
    let hostAmount = (balance * hostBps) / 10000;
    let platformAmount = (balance * platformBps) / 10000;
    let treasuryAmount = (balance * treasuryBps) / 10000;

    var resultAmounts = { winner = 0 : Nat; platform = 0 : Nat; host = 0 : Nat; treasury = 0 : Nat };
    var successCount : Nat = 0;

    // Transfer to winner (90%)
    if (winnerAmount > fee) {
      let winnerSub = subaccountForPrincipal(winnerPrincipal);
      let result = await ledger.icrc1_transfer({
        from_subaccount = ?roomSub;
        to = { owner = Principal.fromActor(Gamerholic); subaccount = ?winnerSub };
        amount = winnerAmount - fee;
        fee = ?fee;
        memo = ?Text.encodeUtf8("Room prize winner: " # challengeId);
        created_at_time = null;
      });
      switch (result) {
        case (#Ok(_)) {
          resultAmounts := { resultAmounts with winner = winnerAmount - fee };
          successCount += 1;
        };
        case (#Err(_)) {};
      };
    };

    // Transfer to host (5%)
    if (hostAmount > fee) {
      let hostSub = subaccountForPrincipal(hostPrincipal);
      let result = await ledger.icrc1_transfer({
        from_subaccount = ?roomSub;
        to = { owner = Principal.fromActor(Gamerholic); subaccount = ?hostSub };
        amount = hostAmount - fee;
        fee = ?fee;
        memo = ?Text.encodeUtf8("Room host fee: " # challengeId);
        created_at_time = null;
      });
      switch (result) {
        case (#Ok(_)) {
          resultAmounts := { resultAmounts with host = hostAmount - fee };
          successCount += 1;
        };
        case (#Err(_)) {};
      };
    };

    // Transfer to platform (4%) - external wallet
    if (platformAmount > fee) {
      let result = await ledger.icrc1_transfer({
        from_subaccount = ?roomSub;
        to = { owner = platformFeePrincipal; subaccount = null };
        amount = platformAmount - fee;
        fee = ?fee;
        memo = ?Text.encodeUtf8("Room platform fee: " # challengeId);
        created_at_time = null;
      });
      switch (result) {
        case (#Ok(_)) {
          resultAmounts := { resultAmounts with platform = platformAmount - fee };
          successCount += 1;
        };
        case (#Err(_)) {};
      };
    };

    // Transfer to treasury (1%) - community vault
    if (treasuryAmount > fee) {
      let treasurySub = subaccountForTreasury();
      let result = await ledger.icrc1_transfer({
        from_subaccount = ?roomSub;
        to = { owner = Principal.fromActor(Gamerholic); subaccount = ?treasurySub };
        amount = treasuryAmount - fee;
        fee = ?fee;
        memo = ?Text.encodeUtf8("Room treasury fee: " # challengeId);
        created_at_time = null;
      });
      switch (result) {
        case (#Ok(_)) {
          resultAmounts := { resultAmounts with treasury = treasuryAmount - fee };
          successCount += 1;
        };
        case (#Err(_)) {};
      };
    };

    if (successCount > 0) {
      return { ok = true; err = ""; amounts = resultAmounts };
    } else {
      return { ok = false; err = "All transfers failed"; amounts = resultAmounts };
    };
  };

  // Helper function to convert Nat64 to Nat for text conversion
  func nat64ToText(n : Nat64) : Text {
    Nat.toText(Nat64.toNat(n))
  };

  // Helper function to verify if token is supported
  func isTokenSupported(tokenId : Text) : Bool {
    switch (supportedTokens.get(tokenId)) {
      case (?_) true;
      case null false;
    }
  };

  // Helper function to convert amount to token decimals
  func convertToTokenDecimals(amount : Nat, tokenId : Text) : Nat {
    switch (supportedTokens.get(tokenId)) {
      case (?tokenInfo) {
        // Convert amount to token's decimal representation
        amount * Nat.pow(10, Nat8.toNat(tokenInfo.decimals))
      };
      case null amount; // Default to no conversion if token not found
    }
  };

  // Helper function to get next power of two for tournament bracket sizing
  func nextPowerOfTwo(n : Nat) : Nat {
    if (n <= 1) { return 2 };
    var power = 2;
    while (power < n) {
      power := power * 2;
    };
    power
  };

  public func setAdmin(a : Address, flag : Bool) : async () { admins.put(a, flag) };
  
  // Token management functions
  public func addSupportedToken(
    caller : Address,
    tokenId : Text,
    name : Text,
    symbol : Text,
    decimals : Nat8,
    ledgerCanister : Text,
    fee : Nat
  ) : async Bool {
    // Only admin can add new tokens
    switch (admins.get(caller)) {
      case (?true) {
        let ledgerPrincipal = Principal.fromText(ledgerCanister);
        supportedTokens.put(tokenId, { name = name; symbol = symbol; decimals = decimals; ledger = ledgerPrincipal; fee = fee });
        true
      };
      case _ false;
    }
  };
  
  public func removeSupportedToken(caller : Address, tokenId : Text) : async Bool {
    // Only admin can remove tokens
    switch (admins.get(caller)) {
      case (?true) {
        supportedTokens.delete(tokenId);
        true
      };
      case _ false;
    }
  };
  
  public query func getSupportedTokens() : async [(Text, TokenInfo)] {
    var result : [(Text, TokenInfo)] = [];
    for ((tokenId, info) in supportedTokens.entries()) {
      result := Array.append<(Text, TokenInfo)>(result, [(tokenId, info)]);
    };
    result
  };

  func hexDecode(hex : Text) : [Nat8] {
    if (Text.size(hex) % 2 != 0) { return [] }; // Invalid hex
    var result : [Nat8] = [];
    let hexChars = Text.toArray(hex);
    var i = 0;
    while (i < hexChars.size()) {
      let high = switch (hexChars[i]) {
        case '0' 0; case '1' 1; case '2' 2; case '3' 3; case '4' 4;
        case '5' 5; case '6' 6; case '7' 7; case '8' 8; case '9' 9;
        case 'a' 10; case 'b' 11; case 'c' 12; case 'd' 13; case 'e' 14; case 'f' 15;
        case 'A' 10; case 'B' 11; case 'C' 12; case 'D' 13; case 'E' 14; case 'F' 15;
        case _ 0;
      };
      let low = if (i + 1 < hexChars.size()) {
        switch (hexChars[i + 1]) {
          case '0' 0; case '1' 1; case '2' 2; case '3' 3; case '4' 4;
          case '5' 5; case '6' 6; case '7' 7; case '8' 8; case '9' 9;
          case 'a' 10; case 'b' 11; case 'c' 12; case 'd' 13; case 'e' 14; case 'f' 15;
          case 'A' 10; case 'B' 11; case 'C' 12; case 'D' 13; case 'E' 14; case 'F' 15;
          case _ 0;
        }
      } else { 0 };
      result := Array.append<Nat8>(result, [Nat8.fromNat(high * 16 + low)]);
      i := i + 2;
    };
    result
  };
  
  public query func getTokenInfo(tokenId : Text) : async ?TokenInfo {
    supportedTokens.get(tokenId)
  };

  // Treasury management functions
  func recordTreasuryTransaction(
    transactionType : {
      #Deposit; #Withdrawal; #RakeCollection; #PrizeDistribution; #PlatformFee; #TreasuryAllocation;
    },
    tokenType : Text,
    amount : Nat,
    fromAddress : ?Text,
    toAddress : ?Text,
    challengeId : ?ChallengeId,
    tournamentId : ?TournamentId,
    description : Text
  ) : Text {
    let txId = "tx_" # Nat64.toText(Nat64.fromNat(Int.abs(Time.now()))) # "_" # Nat.toText(treasuryTransactionList.size());
    let transaction : TreasuryTransaction = {
      id = txId;
      timestamp = Nat64.fromNat(Int.abs(Time.now()));
      transactionType = transactionType;
      tokenType = tokenType;
      amount = amount;
      fromAddress = fromAddress;
      toAddress = toAddress;
      challengeId = challengeId;
      tournamentId = tournamentId;
      description = description;
    };
    treasuryTransactions.put(txId, transaction);
    treasuryTransactionList.add(transaction);
    txId
  };

  public query func getTreasuryTransactions(
    limit : ?Nat,
    offset : ?Nat,
    tokenType : ?Text,
    transactionType : ?{
      #Deposit; #Withdrawal; #RakeCollection; #PrizeDistribution; #PlatformFee; #TreasuryAllocation;
    }
  ) : async [TreasuryTransaction] {
    var result : [TreasuryTransaction] = [];
    let start = switch (offset) { case (?o) o; case null 0 };
    let max = switch (limit) { case (?l) l; case null 100 };
    var count = 0;
    var added = 0;
    
    for (tx in treasuryTransactionList.vals()) {
      if (count >= start and added < max) {
        let matchesToken = switch (tokenType) {
          case (?t) tx.tokenType == t;
          case null true;
        };
        let matchesType = switch (transactionType) {
          case (?tt) tx.transactionType == tt;
          case null true;
        };
        
        if (matchesToken and matchesType) {
          result := Array.append<TreasuryTransaction>(result, [tx]);
          added := added + 1;
        };
      };
      count := count + 1;
    };
    result
  };

  public query func getTreasuryBalance(tokenType : Text) : async Nat {
    var balance = 0;
    for (tx in treasuryTransactionList.vals()) {
      if (tx.tokenType == tokenType) {
        switch (tx.transactionType) {
          case (#Deposit) balance := balance + tx.amount;
          case (#RakeCollection) balance := balance + tx.amount;
          case (#Withdrawal) balance := balance - tx.amount;
          case (#PrizeDistribution) balance := balance - tx.amount;
          case (#PlatformFee) balance := balance + tx.amount;
          case (#TreasuryAllocation) balance := balance + tx.amount;
        }
      }
    };
    balance
  };

  public query func getTreasurySummary() : async [(Text, Nat)] {
    var summary : [(Text, Nat)] = [];
    // WICP is now the primary token, listed first
    let tokens = ["WICP", "ICP", "ckBTC", "ckETH", "XTC"];
    
    for (token in tokens.vals()) {
      var balance = 0;
      for (tx in treasuryTransactionList.vals()) {
        if (tx.tokenType == token) {
          switch (tx.transactionType) {
            case (#Deposit) balance := balance + tx.amount;
            case (#RakeCollection) balance := balance + tx.amount;
            case (#Withdrawal) balance := balance - tx.amount;
            case (#PrizeDistribution) balance := balance - tx.amount;
            case (#PlatformFee) balance := balance + tx.amount;
            case (#TreasuryAllocation) balance := balance + tx.amount;
          }
        }
      };
      if (balance > 0) {
        summary := Array.append<(Text, Nat)>(summary, [(token, balance)]);
      }
    };
    summary
  };

  // Immutable Treasury Pattern - Core Functions
  
  // Public donation function - anyone can donate to treasury
  public func donate(tokenType : Text, amount : Nat, donor : Address, description : Text) : async Bool {
    // Verify token is supported
    if (not isTokenSupported(tokenType)) { return false };
    
    // Record the donation transaction
    let txId = recordTreasuryTransaction(
      #Deposit,
      tokenType,
      amount,
      ?donor,
      null,
      null,
      null,
      description
    );
    
    // Log the donation
    Debug.print("Treasury donation recorded: " # txId # " from " # donor # " amount: " # Nat.toText(amount) # " " # tokenType);
    true
  };

  // Cycle allocation - only Factory principal can allocate cycles to escrows
  public func allocateCycles(caller : Principal, escrowId : Text, cycles : Nat) : async Bool {
    // Verify caller is the Factory canister
    if (Principal.toText(caller) != Principal.toText(Principal.fromActor(Gamerholic))) {
      return false;
    };
    
    // Record the cycle allocation as a treasury transaction
    let txId = recordTreasuryTransaction(
      #TreasuryAllocation,
      "Cycles",
      cycles,
      null,
      ?escrowId,
      null,
      null,
      "Cycle allocation to escrow " # escrowId
    );
    
    Debug.print("Cycle allocation recorded: " # txId # " to escrow " # escrowId # " amount: " # Nat.toText(cycles));
    true
  };

  // Free tournament allocation - only Factory principal can allocate funds
  public func allocateFreeTournamentFunds(caller : Principal, tournamentId : Text, amount : Nat, tokenType : Text) : async Bool {
    // Verify token is supported
    if (not isTokenSupported(tokenType)) { return false };
    
    // Verify caller is the Factory canister
    if (Principal.toText(caller) != Principal.toText(Principal.fromActor(Gamerholic))) {
      return false;
    };
    
    // Check free tournament cap (≤10% of current treasury balance)
    let currentBalance = await getTreasuryBalance(tokenType);
    let maxAllocation = currentBalance / 10; // 10% cap
    
    if (amount > maxAllocation) {
      return false;
    };
    
    // Record the allocation transaction
    let txId = recordTreasuryTransaction(
      #TreasuryAllocation,
      tokenType,
      amount,
      null,
      null,
      null,
      ?tournamentId,
      "Free tournament allocation to " # tournamentId
    );
    
    Debug.print("Free tournament allocation recorded: " # txId # " to tournament " # tournamentId # " amount: " # Nat.toText(amount) # " " # tokenType);
    true
  };

  // Get free tournament allocation limit for a token
  public func getFreeTournamentAllocationLimit(tokenType : Text) : async Nat {
    // Default to WICP if no token specified
    let token = if (tokenType == "") { "WICP" } else { tokenType };
    let currentBalance = await getTreasuryBalance(token);
    currentBalance / 10
  };

  // Get current free tournament allocation usage
  public query func getCurrentFreeTournamentAllocation(tokenType : Text) : async Nat {
    var allocation = 0;
    for (tx in treasuryTransactionList.vals()) {
      if (tx.tokenType == tokenType and tx.transactionType == #TreasuryAllocation) {
        allocation := allocation + tx.amount;
      }
    };
    allocation
  };
  
  // Moderator management
  public func appointModerator(caller : Address, a : Address, role : ModeratorRole) : async Bool {
    // Only AdminMod can appoint other moderators
    let hasPermission = switch (moderators.get(caller)) {
      case (?mod) { mod.role == #AdminMod };
      case null false;
    };
    
    if (not hasPermission) { return false };
    
    let now = Nat64.fromNat(Int.abs(Time.now()));
    let newMod : Moderator = {
      wallet = a;
      role = role;
      appointedAt = now;
      gamesRefereed = 0;
      disputesResolved = 0;
      upvotesReceived = 0;
      lastPromotion = now;
    };
    
    moderators.put(a, newMod);
    true
  };

  // Allow any user to apply as BaseReferee
  public func applyBaseReferee(a : Address) : async Bool {
    switch (moderators.get(a)) {
      case (?_) { true }; // already a moderator
      case null {
        let now = Nat64.fromNat(Int.abs(Time.now()));
        let newMod : Moderator = {
          wallet = a;
          role = #BaseReferee;
          appointedAt = now;
          gamesRefereed = 0;
          disputesResolved = 0;
          upvotesReceived = 0;
          lastPromotion = now;
        };
        moderators.put(a, newMod);
        true
      }
    }
  };

  public query func getModerator(a : Address) : async ?Moderator { moderators.get(a) };
  public query func listModerators() : async [Moderator] { Iter.toArray(moderators.vals()) };
  public query func getMod(a : Address) : async ?Moderator { moderators.get(a) };
  public query func isMod(a : Address) : async Bool {
    switch (moderators.get(a)) { case (?_) true; case null false }
  };
  public query func isAdmin(a : Address) : async Bool {
    let byRole = switch (moderators.get(a)) { case (?m) { m.role == #AdminMod }; case null false };
    let byFlag = switch (admins.get(a)) { case (?flag) flag; case null false };
    byRole or byFlag
  };
  
  public func promoteModerator(caller : Address, a : Address) : async Bool {
    switch (moderators.get(caller)) {
      case (?callerMod) {
        if (callerMod.role != #AdminMod) { return false };
        switch (moderators.get(a)) {
          case (?mod) {
            let now = Nat64.fromNat(Int.abs(Time.now()));
            let newRole = switch (mod.role) {
              case (#BaseReferee) #VettedMod;
              case (#VettedMod) #SuperMod;
              case (#SuperMod) #AdminMod;
              case (#AdminMod) #AdminMod; // Already at highest level
            };
            let updatedMod = { mod with role = newRole; lastPromotion = now };
            moderators.put(a, updatedMod);
            true
          };
          case null false;
        }
      };
      case _ false;
    }
  };

  // Policy getters/setters
  public query func platformFeeRate_() : async Nat { platformFeeRate };
  public query func minimumEntryFee_() : async Nat { minimumEntryFee };
  public query func feeRecipient_() : async Address { feeRecipient };
  
  public func setPlatformFeeRate(caller : Address, r : Nat) : async Bool {
    switch (admins.get(caller)) {
      case (?true) { platformFeeRate := r; true };
      case _ false;
    }
  };
  public func setMinimumEntryFee(caller : Address, f : Nat) : async Bool {
    switch (admins.get(caller)) {
      case (?true) { minimumEntryFee := f; true };
      case _ false;
    }
  };
  public func setFeeRecipient(caller : Address, a : Address) : async Bool {
    switch (admins.get(caller)) {
      case (?true) { feeRecipient := a; true };
      case _ false;
    }
  };

  // Games & Rules
  public func addGame(gameId : Text, name : Text, description : Text, category : Text, creator : Address) : async Bool {
    // Check if game already exists
    switch (games.get(gameId)) {
      case (?_) { return false }; // Game already exists
      case null {};
    };
    
    let now = Nat64.fromNat(Int.abs(Time.now()));
    games.put(gameId, true);
    gameMetadata.put(gameId, { name = name; description = description; category = category; createdBy = creator; createdAt = now });
    gameModerators.put(gameId, [creator]); // Creator becomes first moderator
    true
  };
  
  public func addOfficialGame(gameId : Text, name : Text, description : Text, category : Text, creator : Address) : async Bool {
    // Only SuperMod or AdminMod can add official games
    let hasPermission = switch (moderators.get(creator)) {
      case (?mod) {
        switch (mod.role) {
          case (#SuperMod) true;
          case (#AdminMod) true;
          case _ false;
        }
      };
      case null false;
    };
    
    if (not hasPermission) { return false };
    
    let success = await addGame(gameId, name, description, category, creator);
    if (success) {
      officialGames.put(gameId, true);
    };
    success
  };
  
  public query func listGames() : async [(Text, { name : Text; description : Text; category : Text; createdBy : Address; createdAt : Nat64 })] { 
    var result : [(Text, { name : Text; description : Text; category : Text; createdBy : Address; createdAt : Nat64 })] = [];
    for (gameId in games.keys()) {
      switch (gameMetadata.get(gameId)) {
        case (?metadata) { result := Array.append<(Text, { name : Text; description : Text; category : Text; createdBy : Address; createdAt : Nat64 })>(result, [(gameId, metadata)]) };
        case null {};
      }
    };
    result
  };
  
  public query func listOfficialGames() : async [(Text, { name : Text; description : Text; category : Text; createdBy : Address; createdAt : Nat64 })] {
    var result : [(Text, { name : Text; description : Text; category : Text; createdBy : Address; createdAt : Nat64 })] = [];
    for (gameId in officialGames.keys()) {
      switch (gameMetadata.get(gameId)) {
        case (?metadata) { result := Array.append<(Text, { name : Text; description : Text; category : Text; createdBy : Address; createdAt : Nat64 })>(result, [(gameId, metadata)]) };
        case null {};
      }
    };
    result
  };
  
  public query func getGameInfo(gameId : Text) : async ?{ name : Text; description : Text; category : Text; createdBy : Address; createdAt : Nat64 } {
    gameMetadata.get(gameId)
  };
  
  public func assignGameModerator(gameId : Text, moderator : Address, assigner : Address) : async Bool {
    // Check if assigner has permission (game creator or admin mod)
    let hasPermission = switch (gameMetadata.get(gameId)) {
      case (?metadata) {
        if (metadata.createdBy == assigner) { true } else {
          switch (moderators.get(assigner)) {
            case (?mod) { mod.role == #AdminMod };
            case null false;
          }
        }
      };
      case null false;
    };
    
    if (not hasPermission) { return false };
    
    switch (gameModerators.get(gameId)) {
      case (?currentModerators) {
        // Check if moderator is already assigned
        var found = false;
        for (m in currentModerators.vals()) {
          if (m == moderator) { found := true };
        };
        if (found) { return false };
        
        let updatedModerators = Array.append<Address>(currentModerators, [moderator]);
        gameModerators.put(gameId, updatedModerators);
        true
      };
      case null {
        gameModerators.put(gameId, [moderator]);
        true
      };
    }
  };
  
  public query func getGameModerators(gameId : Text) : async [Address] {
    switch (gameModerators.get(gameId)) { case (?xs) xs; case null [] }
  };

  public func addPresetRules(gameId : Text, title : Text, settings : Text, creator : Address) : async ?Nat {
    // Check if creator is a game moderator or has appropriate role
    let isGameModerator = switch (gameModerators.get(gameId)) {
      case (?moderators) {
        var found = false;
        for (m in moderators.vals()) {
          if (m == creator) { found := true }
        };
        found
      };
      case null false;
    };
    
    let hasGlobalRole = switch (moderators.get(creator)) {
      case (?mod) {
        switch (mod.role) {
          case (#VettedMod) true;
          case (#SuperMod) true;
          case (#AdminMod) true;
          case _ false;
        }
      };
      case null false;
    };
    
    if (not isGameModerator and not hasGlobalRole) { return null };
    
    let current = switch (rulesByGame.get(gameId)) { case (?xs) xs; case null [] };
    let rid : Nat = Int.abs(Time.now());
    let rs : Ruleset = { id = rid; title = title; settings = settings; votes = 0; official = false };
    rulesByGame.put(gameId, Array.append<Ruleset>(current, [rs]));
    ?rid
  };
  public func upvoteRules(gameId : Text, rulesetId : Nat, voter : Address) : async Bool {
    // Check if voter is a game moderator or has appropriate role
    let isGameModerator = switch (gameModerators.get(gameId)) {
      case (?moderators) {
        var found = false;
        for (m in moderators.vals()) {
          if (m == voter) { found := true }
        };
        found
      };
      case null false;
    };
    
    let hasGlobalRole = switch (moderators.get(voter)) {
      case (?mod) {
        switch (mod.role) {
          case (#BaseReferee) true;
          case (#VettedMod) true;
          case (#SuperMod) true;
          case (#AdminMod) true;
        }
      };
      case null false;
    };
    
    if (not isGameModerator and not hasGlobalRole) { return false };
    
    let current = switch (rulesByGame.get(gameId)) { case (?xs) xs; case null [] };
    var changed : Bool = false;
    let updated = Array.map<Ruleset, Ruleset>(current, func (r : Ruleset) : Ruleset {
      if (r.id == rulesetId) { changed := true; { id = r.id; title = r.title; settings = r.settings; votes = r.votes + 1; official = r.official } } else { r }
    });
    if (changed) { rulesByGame.put(gameId, updated); };
    changed
  };
  
  public func setOfficialRules(gameId : Text, rulesetId : Nat, setter : Address) : async Bool {
    // Only SuperMod or AdminMod can set official rules
    let hasPermission = switch (moderators.get(setter)) {
      case (?mod) {
        switch (mod.role) {
          case (#SuperMod) true;
          case (#AdminMod) true;
          case _ false;
        }
      };
      case null false;
    };
    
    if (not hasPermission) { return false };
    
    let current = switch (rulesByGame.get(gameId)) { case (?xs) xs; case null [] };
    var changed : Bool = false;
    let updated = Array.map<Ruleset, Ruleset>(current, func (r : Ruleset) : Ruleset {
      let isOfficial = r.id == rulesetId;
      if (isOfficial) { changed := true }; { id = r.id; title = r.title; settings = r.settings; votes = r.votes; official = isOfficial }
    });
    if (changed) { rulesByGame.put(gameId, updated) };
    changed
  };
  
  public func removeRuleset(gameId : Text, rulesetId : Nat, remover : Address) : async Bool {
    // Check if remover has permission (game moderator or admin mod)
    let hasPermission = switch (gameModerators.get(gameId)) {
      case (?moderators) {
        var found = false;
        for (m in moderators.vals()) {
          if (m == remover) { found := true }
        };
        found
      };
      case null false;
    };
    
    let isAdmin = switch (moderators.get(remover)) {
      case (?mod) { mod.role == #AdminMod };
      case null false;
    };
    
    if (not hasPermission and not isAdmin) { return false };
    
    let current = switch (rulesByGame.get(gameId)) { case (?xs) xs; case null [] };
    var newRules : [Ruleset] = [];
    var removed = false;
    
    for (rule in current.vals()) {
      if (rule.id != rulesetId) {
        newRules := Array.append<Ruleset>(newRules, [rule]);
      } else {
        removed := true;
      }
    };
    
    if (removed) {
      rulesByGame.put(gameId, newRules);
    };
    removed
  };
  public query func listRules(gameId : Text) : async [Ruleset] { switch (rulesByGame.get(gameId)) { case (?xs) xs; case null [] } };
  
  public query func getOfficialRuleset(gameId : Text) : async ?Ruleset {
    switch (rulesByGame.get(gameId)) {
      case (?rules) {
        var officialRule : ?Ruleset = null;
        for (rule in rules.vals()) {
          if (rule.official) {
            officialRule := ?rule;
            return officialRule;
          }
        };
        officialRule
      };
      case null null;
    }
  };
  
  public query func getTopVotedRuleset(gameId : Text) : async ?Ruleset {
    switch (rulesByGame.get(gameId)) {
      case (?rules) {
        if (rules.size() == 0) { return null };
        var topRule = rules[0];
        for (rule in rules.vals()) {
          if (rule.votes > topRule.votes) {
            topRule := rule;
          }
        };
        ?topRule
      };
      case null null;
    }
  };
  
  public func autoPromoteTopRuleset(gameId : Text, promoter : Address) : async Bool {
    // Only SuperMod or AdminMod can auto-promote
    let hasPermission = switch (moderators.get(promoter)) {
      case (?mod) {
        switch (mod.role) {
          case (#SuperMod) true;
          case (#AdminMod) true;
          case _ false;
        }
      };
      case null false;
    };
    
    if (not hasPermission) { return false };
    
    // Get top voted ruleset synchronously
    let rules = switch (rulesByGame.get(gameId)) {
      case (?rs) rs;
      case null return false;
    };
    
    if (rules.size() == 0) { return false };
    var topRule = rules[0];
    for (rule in rules.vals()) {
      if (rule.votes > topRule.votes) {
        topRule := rule;
      }
    };
    
    if (topRule.votes >= 5) { // Minimum 5 votes to auto-promote
      await setOfficialRules(gameId, topRule.id, promoter)
    } else {
      false
    }
  };

  // Enhanced Ruleset Voting Functions
  public func downvoteRules(gameId : Text, rulesetId : Nat, voter : Address) : async Bool {
    // Check if voter is a game moderator or has appropriate role
    let isGameModerator = switch (gameModerators.get(gameId)) {
      case (?moderators) {
        var found = false;
        for (m in moderators.vals()) {
          if (m == voter) { found := true }
        };
        found
      };
      case null false;
    };
    
    let hasGlobalRole = switch (moderators.get(voter)) {
      case (?mod) {
        switch (mod.role) {
          case (#BaseReferee) true;
          case (#VettedMod) true;
          case (#SuperMod) true;
          case (#AdminMod) true;
        }
      };
      case null false;
    };
    
    if (not isGameModerator and not hasGlobalRole) { return false };
    
    let current = switch (rulesByGame.get(gameId)) { case (?xs) xs; case null [] };
    var changed : Bool = false;
    let updated = Array.map<Ruleset, Ruleset>(current, func (r : Ruleset) : Ruleset {
      if (r.id == rulesetId and r.votes > 0) { changed := true; { id = r.id; title = r.title; settings = r.settings; votes = r.votes - 1; official = r.official } } else { r }
    });
    if (changed) { rulesByGame.put(gameId, updated); };
    changed
  };

  public func getRulesetVotes(gameId : Text, rulesetId : Nat) : async ?Nat {
    switch (rulesByGame.get(gameId)) {
      case (?rules) {
        for (rule in rules.vals()) {
          if (rule.id == rulesetId) { return ?rule.votes }
        };
        null
      };
      case null null;
    }
  };

  public func getGameRulesSummary(gameId : Text) : async ?{
    totalRulesets : Nat;
    officialRuleset : ?Ruleset;
    topVotedRuleset : ?Ruleset;
    totalVotes : Nat;
  } {
    let rules = switch (rulesByGame.get(gameId)) { case (?xs) xs; case null [] };
    if (rules.size() == 0) { return ?{ totalRulesets = 0; officialRuleset = null; topVotedRuleset = null; totalVotes = 0 } };
    
    var officialRule : ?Ruleset = null;
    var topVotedRule : ?Ruleset = null;
    var totalVotes = 0;
    
    for (rule in rules.vals()) {
      totalVotes := totalVotes + rule.votes;
      if (rule.official) { officialRule := ?rule };
      switch (topVotedRule) {
        case null { topVotedRule := ?rule };
        case (?current) { if (rule.votes > current.votes) { topVotedRule := ?rule } };
      };
    };
    
    ?{
      totalRulesets = rules.size();
      officialRuleset = officialRule;
      topVotedRuleset = topVotedRule;
      totalVotes = totalVotes;
    }
  };

  // Daily minimum bet per game
  public func setDailyMinBet(gameId : Text, amount : Nat, caller : Address) : async Bool {
    let now = Nat64.fromNat(Int.abs(Time.now()));
    let last : Nat64 = switch (lastMinBetUpdate.get(gameId)) { case (?t) t; case null Nat64.fromNat(0) };
    let dayInSeconds : Nat64 = 86400;
    
    // Can only update once per day
    if (now < last + dayInSeconds) { return false };
    
    // Check if caller is SuperMod or AdminMod
    switch (moderators.get(caller)) {
      case (?mod) {
        switch (mod.role) {
          case (#SuperMod) {
            minBetByGame.put(gameId, amount);
            lastMinBetUpdate.put(gameId, now);
            true
          };
          case (#AdminMod) {
            minBetByGame.put(gameId, amount);
            lastMinBetUpdate.put(gameId, now);
            true
          };
          case _ false;
        }
      };
      case null false;
    }
  };
  public query func getDailyMinBet(gameId : Text) : async Nat { switch (minBetByGame.get(gameId)) { case (?a) a; case null 0 } };

  // Enhanced Game Management Functions
  public func updateGameMetadata(gameId : Text, name : Text, description : Text, category : Text, updater : Address) : async Bool {
    // Check if updater has permission (game moderator or admin mod)
    let hasPermission = switch (gameModerators.get(gameId)) {
      case (?moderators) {
        var found = false;
        for (m in moderators.vals()) {
          if (m == updater) { found := true }
        };
        found
      };
      case null false;
    };
    
    let isAdmin = switch (moderators.get(updater)) {
      case (?mod) { mod.role == #AdminMod };
      case null false;
    };
    
    if (not hasPermission and not isAdmin) { return false };
    
    switch (gameMetadata.get(gameId)) {
      case (?currentMetadata) {
        let updatedMetadata = { currentMetadata with name = name; description = description; category = category };
        gameMetadata.put(gameId, updatedMetadata);
        true
      };
      case null false;
    }
  };

  public func addGameModerator(gameId : Text, moderator : Address, adder : Address) : async Bool {
    // Check if adder has permission (game moderator or admin mod)
    let hasPermission = switch (gameModerators.get(gameId)) {
      case (?moderators) {
        var found = false;
        for (m in moderators.vals()) {
          if (m == adder) { found := true }
        };
        found
      };
      case null false;
    };
    
    let isAdmin = switch (moderators.get(adder)) {
      case (?mod) { mod.role == #AdminMod };
      case null false;
    };
    
    if (not hasPermission and not isAdmin) { return false };
    
    switch (gameModerators.get(gameId)) {
      case (?currentModerators) {
        // Check if moderator is already assigned
        var found = false;
        for (m in currentModerators.vals()) {
          if (m == moderator) { found := true }
        };
        if (found) { return false };
        
        let updatedModerators = Array.append<Address>(currentModerators, [moderator]);
        gameModerators.put(gameId, updatedModerators);
        true
      };
      case null {
        gameModerators.put(gameId, [moderator]);
        true
      };
    }
  };

  public func removeGameModerator(gameId : Text, moderator : Address, remover : Address) : async Bool {
    // Check if remover has permission (game moderator or admin mod)
    let hasPermission = switch (gameModerators.get(gameId)) {
      case (?moderators) {
        var found = false;
        for (m in moderators.vals()) {
          if (m == remover) { found := true }
        };
        found
      };
      case null false;
    };
    
    let isAdmin = switch (moderators.get(remover)) {
      case (?mod) { mod.role == #AdminMod };
      case null false;
    };
    
    if (not hasPermission and not isAdmin) { return false };
    
    switch (gameModerators.get(gameId)) {
      case (?currentModerators) {
        var newModerators : [Address] = [];
        var removed = false;
        
        for (m in currentModerators.vals()) {
          if (m != moderator) {
            newModerators := Array.append<Address>(newModerators, [m]);
          } else {
            removed := true;
          }
        };
        
        if (removed) {
          gameModerators.put(gameId, newModerators);
        };
        removed
      };
      case null false;
    }
  };

  public query func getGameDetails(gameId : Text) : async ?{
    metadata : { name : Text; description : Text; category : Text; createdBy : Address; createdAt : Nat64 };
    moderators : [Address];
    rules : [Ruleset];
    isOfficial : Bool;
  } {
    switch (gameMetadata.get(gameId)) {
      case (?metadata) {
        let moderators = switch (gameModerators.get(gameId)) { case (?xs) xs; case null [] };
        let rules = switch (rulesByGame.get(gameId)) { case (?xs) xs; case null [] };
        let isOfficial = switch (officialGames.get(gameId)) { case (?o) o; case null false };
        ?{
          metadata = metadata;
          moderators = moderators;
          rules = rules;
          isOfficial = isOfficial;
        }
      };
      case null null;
    }
  };

  // Penalties
  public func penalizeUser(a : Address, days : Nat, multiplier : Nat) : async Bool {
    let until = Nat64.fromNat(Int.abs(Time.now()));
    let extend = Nat64.fromNat(Int.abs(days * 24 * 3600));
    penalties.put(a, { surchargeUntil = until + extend; multiplier = multiplier });
    true
  };
  public query func getPenalty(a : Address) : async ?Penalty { penalties.get(a) };

  // Tournaments
  public func createTournament(creator : Address, entryFee : Nat, payToken : Text, maxParticipants : Nat, xftToJoin : Nat, isFFA : Bool, gameType : Text, metadata : Text) : async TournamentId {
    await createTournamentEx(creator, entryFee, payToken, maxParticipants, xftToJoin, isFFA, gameType, metadata, gameType, "PC", 0, false, "", 200, false, "")
  };

  /// Extended tournament create: title, console, schedule (ns), betable, marketId, hostFeeBps, teamEntry, streamUrl
  public func createTournamentEx(
    creator : Address,
    entryFee : Nat,
    payToken : Text,
    maxParticipants : Nat,
    xftToJoin : Nat,
    isFFA : Bool,
    gameType : Text,
    metadata : Text,
    title : Text,
    console : Text,
    scheduledAt : Nat64,
    betable : Bool,
    marketId : Text,
    hostFeeBps : Nat,
    teamEntry : Bool,
    streamUrl : Text,
  ) : async TournamentId {
    let id : TournamentId = "tour-" # Nat.toText(Int.abs(Time.now()));
    let now = Nat64.fromNat(Int.abs(Time.now()));
    let deadline = if (scheduledAt > now) { scheduledAt + 86400 * 7 } else { now + 86400 * 30 };
    let feeBps = if (hostFeeBps > 1000) { 1000 } else { hostFeeBps };
    let info : TournamentInfo = {
      creator = creator;
      entryFee = entryFee;
      maxParticipants = maxParticipants;
      xftToJoin = xftToJoin;
      createdAt = now;
      deadline = deadline;
      gameType = gameType;
      metadata = metadata;
      payToken = payToken;
      isFFA = isFFA;
      status = 1;
      totalPrizePool = 0;
      hostFeeBps = feeBps;
      title = if (title == "") { gameType } else { title };
      console = console;
      scheduledAt = scheduledAt;
      betable = betable;
      marketId = marketId;
      teamEntry = teamEntry;
      registrationOpen = true;
      streamUrl = streamUrl;
      coverUrl = "";
    };
    tournaments.put(id, info);
    tournamentHosts.put(id, creator);
    tournamentParticipants.put(id, []);
    tournamentActives.put(id, []);
    id
  };

  public func setTournamentBetable(id : TournamentId, who : Address, betable : Bool, marketId : Text) : async Bool {
    switch (tournaments.get(id)) {
      case null { false };
      case (?t) {
        if (t.creator != who) { return false };
        if (betable and t.scheduledAt != 0) {
          let now = Nat64.fromNat(Int.abs(Time.now()));
          // scheduledAt stored as ns from FE — require ≥ 1h out when enabling
          if (t.scheduledAt < now + 3_600_000_000_000) { return false };
        };
        tournaments.put(id, { t with betable = betable; marketId = marketId });
        // Opening a market clears settled flag so claim is blocked until resolve
        if (betable and marketId != "") {
          betableSettledByEntity.put(id, false);
        } else if (not betable) {
          betableSettledByEntity.delete(id);
        };
        true
      };
    }
  };

  public query func getBackendPrincipal() : async Text {
    Principal.toText(Principal.fromActor(Gamerholic))
  };

  public func setTournamentSchedule(id : TournamentId, who : Address, scheduledAt : Nat64) : async Bool {
    switch (tournaments.get(id)) {
      case null { false };
      case (?t) {
        if (t.creator != who) { return false };
        tournaments.put(id, { t with scheduledAt = scheduledAt });
        true
      };
    }
  };

  public query func getTournamentInfo(id : TournamentId) : async ?TournamentInfo { tournaments.get(id) };
  public query func getParticipants(id : TournamentId) : async [Address] { switch (tournamentParticipants.get(id)) { case (?xs) xs; case null [] } };
  public query func getActiveParticipants(id : TournamentId) : async [Address] { switch (tournamentActives.get(id)) { case (?xs) xs; case null [] } };
  public query func getHost(id : TournamentId) : async ?Address { tournamentHosts.get(id) };
  
  public func setTournamentMetadata(id : TournamentId, metadata : Text) : async Bool {
    switch (tournaments.get(id)) {
      case null { false };
      case (?t) { tournaments.put(id, { t with metadata = metadata }); true };
    }
  };

  public func joinTournament(id : TournamentId, player : Address) : async Bool {
    switch (tournaments.get(id)) {
      case null { return false };
      case (?tournament) {
        if (tournament.status != 1) { return false }; // Not open
        
        // Check SLA deadline
        let now = Nat64.fromNat(Int.abs(Time.now()));
        if (now > tournament.deadline) { return false }; // Past SLA deadline
        
        // Check if player is the host (creator cannot join own tournament)
        let host = switch (tournamentHosts.get(id)) { case (?h) h; case null "" };
        if (host == player) { return false }; // Creator cannot join own tournament
        
        let current = switch (tournamentParticipants.get(id)) { case (?xs) xs; case null [] };
        if (current.size() >= tournament.maxParticipants) { return false }; // Full
        
        // Check if already joined
        for (p in current.vals()) {
          if (p == player) { return false };
        };
        
        let updated = Array.append<Address>(current, [player]);
        tournamentParticipants.put(id, updated);
        true
      }
    }
  };

  public query func canJoinTournament(id : TournamentId, addr : Address) : async Bool {
    let host = switch (tournamentHosts.get(id)) { case (?h) h; case null "" };
    if (host != "" and host == addr) { return false };
    true
  };

  public func setHostFeeBps(id : TournamentId, bps : Nat) : async Bool {
    switch (tournaments.get(id)) {
      case null { false };
      case (?t) {
        if (bps > 1000) { return false }; // Max 10%
        tournaments.put(id, { t with hostFeeBps = bps });
        true
      }
    }
  };

  public func cancelTournament(id : TournamentId, _reason : Text) : async Bool {
    switch (tournaments.remove(id)) { case (?_) true; case null false }
  };
  public func cancelTournamentByMod(id : TournamentId, reason : Text) : async Bool {
    switch (tournaments.get(id)) {
      case null { false };
      case (?tournament) {
        // Get tournament participants for refunds
        let participants = switch (tournamentParticipants.get(id)) { 
          case (?xs) xs; 
          case null [] 
        };
        
        // Calculate total refund amount
        var totalRefunded = 0;
        var participantsRefunded : [Address] = [];
        
        // Refund entry fees to all participants (entry fees + service fees per policy)
        for (participant in participants.vals()) {
          if (tournament.entryFee > 0) {
            participantsRefunded := Array.append(participantsRefunded, [participant]);
            totalRefunded += tournament.entryFee;
          }
        };
        
        // Log refund transaction for audit trail
        let refundLog : TournamentRefundLog = {
          tournamentId = id;
          moderator = tournament.creator;
          refundAmount = tournament.entryFee;
          refundToken = tournament.payToken;
          refundReason = reason;
          timestamp = Nat64.fromNat(Int.abs(Time.now()));
          participantsRefunded = participantsRefunded;
          totalRefunded = totalRefunded;
        };
        
        // Add to tournament refunds tracking
        switch (tournamentRefunds.get(id)) {
          case null { tournamentRefunds.put(id, [refundLog]) };
          case (?logs) { tournamentRefunds.put(id, Array.append(logs, [refundLog])) }
        };
        
        // Update tournament status to cancelled (0)
        tournaments.put(id, { tournament with status = 0 });
        
        // Log moderator action
        let modLog : ModeratorActionLog = {
          tournamentId = id;
          moderator = tournament.creator;
          actionType = #Cancel;
          actionReason = reason;
          timestamp = Nat64.fromNat(Int.abs(Time.now()));
          affectedPlayers = participantsRefunded;
          metadata = "Tournament cancelled by moderator";
        };
        
        switch (moderatorActions.get(id)) {
          case null { moderatorActions.put(id, [modLog]) };
          case (?logs) { moderatorActions.put(id, Array.append(logs, [modLog])) }
        };
        
        true
      }
    }
  };

  // Lists
  public query func listTournaments() : async [(TournamentId, TournamentInfo)] {
    Iter.toArray(tournaments.entries())
  };
  public query func listChallenges() : async [(ChallengeId, ChallengeInfo)] {
    Iter.toArray(challenges.entries())
  };

  // Challenges
  public func createHeadsUpChallenge(creator : Address, challengeType : Nat, opponent : Address, gameType : Text, tournamentId : TournamentId, payToken : Text, metadata : Text) : async ChallengeId {
    await createChallengeEx(creator, challengeType, opponent, gameType, tournamentId, payToken, metadata, 0, gameType, "PC", 0, false, "", "", "", "")
  };

  /// Full create: entryFee (e8s), title, console, scheduledAt (ns), betable, marketId, monitor, creatorStream
  public func createChallengeEx(
    creator : Address,
    challengeType : Nat,
    opponent : Address,
    gameType : Text,
    tournamentId : TournamentId,
    payToken : Text,
    metadata : Text,
    entryFee : Nat,
    title : Text,
    console : Text,
    scheduledAt : Nat64,
    betable : Bool,
    marketId : Text,
    monitor : Address,
    creatorStream : Text,
    _reserved : Text,
  ) : async ChallengeId {
    let id : ChallengeId = "chal-" # Nat.toText(Int.abs(Time.now()));
    let now = Nat64.fromNat(Int.abs(Time.now()));
    // Betable requires schedule ≥ 1 hour (ns)
    let betableOk = if (betable) {
      scheduledAt >= now + 3_600_000_000_000
    } else { true };
    let useBetable = betable and betableOk and tournamentId == "";
    // Tournament-linked challenges inherit no independent betable market when parent has none —
    // FE passes tournamentId; canister forces betable=false for tourney matches unless marketId set on tourney later.
    let finalBetable = if (tournamentId != "") { false } else { useBetable };
    let info : ChallengeInfo = {
      challengeType = challengeType;
      status = 1;
      creator = creator;
      opponent = opponent;
      entryFee = entryFee;
      totalPrizePool = entryFee;
      createdAt = now;
      currentParticipants = 1;
      player1score = 0;
      player2score = 0;
      scoreReporter = "";
      timeScored = 0;
      timeScoreConfirmed = 0;
      gameType = gameType;
      metadata = metadata;
      tournament = tournamentId;
      payToken = payToken;
      contractBalance = 0;
      expiresAt = now + 86_400_000_000_000; // 24h in ns
      autoResolveThreshold = 172_800_000_000_000; // 48h ns
      title = if (title == "") { gameType } else { title };
      console = console;
      scheduledAt = scheduledAt;
      betable = finalBetable;
      marketId = if (finalBetable) { if (marketId == "") { id # "-market" } else { marketId } } else { "" };
      monitor = monitor;
      creatorStream = creatorStream;
      opponentStream = "";
      scoreIsFinal = false;
      cancelRequester = ("" : Address);
      cancelRequestedAt = (0 : Nat64);
      disputeVideo = "";
      disputeReason = "";
      disputeBy = ("" : Address);
    };
    challenges.put(id, info);
    challengeParticipants.put(id, [creator]);
    id
  };

  public query func getChallengeInfo(id : ChallengeId) : async ?ChallengeInfo { challenges.get(id) };

  // Check if a challenge has expired
  public query func isChallengeExpired(id : ChallengeId) : async Bool {
    switch (challenges.get(id)) {
      case null false;
      case (?challenge) {
        let now = Nat64.fromNat(Int.abs(Time.now()));
        now > challenge.expiresAt
      };
    }
  };

  // Get challenges approaching expiration (within specified hours)
  public query func getExpiringChallenges(hoursBeforeExpiration : Nat64) : async [(ChallengeId, ChallengeInfo)] {
    var expiring : [(ChallengeId, ChallengeInfo)] = [];
    let now = Nat64.fromNat(Int.abs(Time.now()));
    let threshold = hoursBeforeExpiration * 3600; // Convert hours to seconds
    
    for ((id, challenge) in challenges.entries()) {
      if (challenge.status == 1 and now > challenge.expiresAt - threshold and now <= challenge.expiresAt) {
        expiring := Array.append<(ChallengeId, ChallengeInfo)>(expiring, [(id, challenge)]);
      };
    };
    
    expiring
  };

  // Get challenges that have expired but not yet auto-resolved
  public query func getStaleChallenges() : async [(ChallengeId, ChallengeInfo)] {
    var stale : [(ChallengeId, ChallengeInfo)] = [];
    let now = Nat64.fromNat(Int.abs(Time.now()));
    
    for ((id, challenge) in challenges.entries()) {
      if (challenge.status == 1 and now > challenge.expiresAt and now <= challenge.expiresAt + challenge.autoResolveThreshold) {
        stale := Array.append<(ChallengeId, ChallengeInfo)>(stale, [(id, challenge)]);
      };
    };
    
    stale
  };

  // Auto-resolve all expired challenges in batch
  public func autoResolveAllExpiredChallenges() : async Nat {
    let expiredChallenges = await getExpiredChallenges();
    var resolvedCount = 0;
    
    for (challengeId in expiredChallenges.vals()) {
      if (await autoResolveExpiredChallenge(challengeId)) {
        resolvedCount := resolvedCount + 1;
      };
    };
    
    resolvedCount
  };

  public query func getExpiredChallenges() : async [ChallengeId] {
    var expired : [ChallengeId] = [];
    let now = Nat64.fromNat(Int.abs(Time.now()));
    
    for ((id, challenge) in challenges.entries()) {
      if (challenge.status == 1 and now > challenge.expiresAt + challenge.autoResolveThreshold) {
        expired := Array.append<ChallengeId>(expired, [id]);
      };
    };
    
    expired
  };

  // Auto-resolve expired challenge (cancel and refund)
  public func autoResolveExpiredChallenge(id : ChallengeId) : async Bool {
    switch (challenges.get(id)) {
      case null false;
      case (?challenge) {
        if (challenge.status != 1) { return false }; // Only auto-resolve open challenges
        
        let now = Nat64.fromNat(Int.abs(Time.now()));
        if (now <= challenge.expiresAt + challenge.autoResolveThreshold) {
          return false; // Not yet eligible for auto-resolution
        };
        
        // Cancel the challenge and refund any deposits
        challenges.put(id, { challenge with status = 4 }); // Status 4 = cancelled
        
        // Record treasury transaction for refund
        let _txId = recordTreasuryTransaction(
          #Withdrawal,
          challenge.payToken,
          challenge.contractBalance,
          ?"treasury",
          ?challenge.creator,
          ?id,
          null,
          "Auto-refund for expired challenge"
        );
        
        true
      };
    }
  };

  // Extend challenge expiration time
  public func extendChallengeExpiration(id : ChallengeId, additionalTime : Nat64) : async Bool {
    switch (challenges.get(id)) {
      case null false;
      case (?challenge) {
        if (challenge.status != 1) { return false }; // Only extend open challenges
        
        challenges.put(id, { challenge with expiresAt = challenge.expiresAt + additionalTime });
        true
      };
    }
  };

  // Batch auto-resolve expired challenges (can be called by moderators or automated)
  public func batchAutoResolveExpiredChallenges() : async Nat {
    let expiredChallenges = await getExpiredChallenges();
    var resolvedCount = 0;
    
    for (challengeId in expiredChallenges.vals()) {
      if (await autoResolveExpiredChallenge(challengeId)) {
        resolvedCount := resolvedCount + 1;
      };
    };
    
    resolvedCount
  };

  public func joinChallenge(id : ChallengeId, player : Address) : async Bool {
    await joinChallengeEx(id, player, "")
  };

  public func joinChallengeEx(id : ChallengeId, player : Address, opponentStream : Text) : async Bool {
    switch (challenges.get(id)) {
      case null { false };
      case (?c) {
        if (c.status != 1) { return false }; // Not open
        let now = Nat64.fromNat(Int.abs(Time.now()));
        if (now > c.expiresAt) { return false };
        if (c.currentParticipants >= 2) { return false };
        if (player == c.creator) { return false };
        let parts = switch (challengeParticipants.get(id)) { case (?xs) xs; case null [] };
        for (p in parts.vals()) {
          if (p == player) { return false };
        };
        // Status 2 = in progress (both seats)
        challenges.put(id, {
          c with
          opponent = player;
          opponentStream = opponentStream;
          currentParticipants = c.currentParticipants + 1;
          status = 2;
          totalPrizePool = c.entryFee * 2;
        });
        challengeParticipants.put(id, Array.append<Address>(parts, [player]));
        true
      }
    }
  };

  public func setPlayerStream(id : ChallengeId, who : Address, streamUrl : Text) : async Bool {
    switch (challenges.get(id)) {
      case null { false };
      case (?c) {
        if (who == c.creator) {
          challenges.put(id, { c with creatorStream = streamUrl });
          true
        } else if (who == c.opponent) {
          challenges.put(id, { c with opponentStream = streamUrl });
          true
        } else { false }
      }
    }
  };

  public func setChallengeMonitor(id : ChallengeId, who : Address, monitor : Address) : async Bool {
    switch (challenges.get(id)) {
      case null { false };
      case (?c) {
        if (who != c.creator and who != c.opponent) { return false };
        // Betable requires monitor
        challenges.put(id, { c with monitor = monitor });
        true
      }
    }
  };

  public func openChallengeBetable(id : ChallengeId, who : Address, marketId : Text, scheduledAt : Nat64, monitor : Address) : async Bool {
    switch (challenges.get(id)) {
      case null { false };
      case (?c) {
        if (c.tournament != "") { return false }; // Tourney matches cannot open independent markets
        if (c.betable) { return false };
        if (c.player1score > 0 or c.player2score > 0 or c.scoreIsFinal) { return false };
        if (who != c.creator and who != c.opponent) { return false };
        let mon = if (monitor != "") { monitor } else { c.monitor };
        if (mon == "") { return false };
        let now = Nat64.fromNat(Int.abs(Time.now()));
        let sched = if (scheduledAt > 0) { scheduledAt } else { c.scheduledAt };
        if (sched < now + 3_600_000_000_000) { return false };
        let mid = if (marketId == "") { id # "-market" } else { marketId };
        challenges.put(id, {
          c with
          betable = true;
          marketId = mid;
          scheduledAt = sched;
          monitor = mon;
        });
        betableSettledByEntity.put(id, false);
        true
      }
    }
  };

  public func submitScore(id : ChallengeId, p1 : Nat, p2 : Nat) : async Bool {
    await submitScoreEx(id, p1, p2, "", false)
  };

  public func submitScoreEx(id : ChallengeId, p1 : Nat, p2 : Nat, reporter : Address, isFinal : Bool) : async Bool {
    switch (challenges.get(id)) {
      case null { false };
      case (?c) {
        if (c.status != 2 and c.status != 3) { return false }; // in progress or resubmit pending
        if (c.cancelRequester != "") { return false }; // pause while cancel pending
        let now = Nat64.fromNat(Int.abs(Time.now()));
        challenges.put(id, {
          c with
          player1score = p1;
          player2score = p2;
          scoreReporter = reporter;
          timeScored = now;
          scoreIsFinal = isFinal;
          status = 3;
        });
        true
      }
    }
  };

  public func confirmScore(id : ChallengeId, confirmer : Address) : async Bool {
    switch (challenges.get(id)) {
      case null { false };
      case (?c) {
        if (c.status != 3) { return false }; // Not scored
        if (confirmer == c.scoreReporter) { return false }; // Other party confirms
        let now = Nat64.fromNat(Int.abs(Time.now()));
        let nextStatus = if (c.scoreIsFinal) { 4 } else { 2 }; // settled or back to live
        challenges.put(id, {
          c with
          status = nextStatus;
          timeScoreConfirmed = now;
        });
        true
      }
    }
  };

  // Settlement helpers
  func computeSettlement(pot : Nat, rakePercent : Nat) : Settlement {
    let rake = (pot * rakePercent) / 100;
    let cycles = (rake * 60) / 100;
    let treasury = (rake * 25) / 100;
    let platform = (rake * 15) / 100;
    {
      pot = pot - rake;
      rakePercent = rakePercent;
      rake = rake;
      winner = "";
      claimed = false;
    }
  };
  
  func computeGamerSettlement(pot : Nat, gamerAddress : Address) : async Settlement {
    // Get gamer's base rake and any penalty multiplier
    let gamer = switch (gamers.get(gamerAddress)) {
      case (?g) g;
      case null {
        // Create default gamer if doesn't exist
        let defaultGamer : Gamer = {
          wallet = gamerAddress;
          username = "Anonymous";
          avatarUrl = "";
          baseRake = 800; // 8% default
          totalGamesPlayed = 0;
          totalTournamentsHosted = 0;
          disputeWinRate = 0;
          upvotes = 0;
          penaltyMultiplier = 1;
          wins = 0;
          losses = 0;
          currentWinStreak = 0;
          currentLossStreak = 0;
          longestWinStreak = 0;
          longestLossStreak = 0;
          gameRecords = [];
          // Earnings tracking
          totalHeadsUpEarnings = 0;
          totalHeadsUpLosses = 0;
          totalTournamentEarnings = 0;
          totalTournamentLosses = 0;
          tournamentWins = 0;
          tournamentLosses = 0;
          earningsByToken = [];
        };
        gamers.put(gamerAddress, defaultGamer);
        defaultGamer
      };
    };
    
    // Calculate effective rake with penalty multiplier
    let effectiveRake = (gamer.baseRake * gamer.penaltyMultiplier) / 100;
    
    computeSettlement(pot, effectiveRake)
  };

  public func claimChallenge(id : ChallengeId, pot : Nat, winner : Address, serviceFee : Nat) : async Bool {
    switch (challenges.get(id)) {
      case null { return false };
      case (?c) {
        if (c.status != 4) { return false }; // Not confirmed
        // Block prize claim until linked betable market is marked settled
        if (not requireBetableSettled(id, c.betable, c.marketId)) { return false };
        
        // Determine the loser for statistics update
        let participants = switch (challengeParticipants.get(id)) {
          case (?parts) parts;
          case null [];
        };
        
        var loser = "";
        for (participant in participants.vals()) {
          if (participant != winner) {
            loser := participant;
          };
        };
        
        if (loser == "") { return false }; // Could not determine loser
        
        // Update gamer statistics before processing settlement
        updateGamerStatistics(winner, loser, c.gameType, c.entryFee);
        
        let settlement = await computeGamerSettlement(pot, winner);
        
        // Update earnings tracking for heads-up challenge
        updateGamerEarnings(winner, false, true, settlement.pot, c.payToken); // Winner earnings
        updateGamerEarnings(loser, false, false, c.entryFee, c.payToken); // Loser losses (entry fee)
        
        // Record treasury transactions for immutable audit trail
        let txId1 = recordTreasuryTransaction(
          #RakeCollection,
          c.payToken,
          settlement.rake,
          ?c.creator,
          null,
          ?id,
          null,
          "Rake collected from challenge " # id
        );
        
        let txId2 = recordTreasuryTransaction(
          #PrizeDistribution,
          c.payToken,
          settlement.pot,
          null,
          ?winner,
          ?id,
          null,
          "Prize distributed to winner of challenge " # id
        );
        
        // Allocate cycles from rake (60% of rake goes to cycles)
        let cyclesFromRake = (settlement.rake * 60) / 100;
        let _ = await allocateCycles(Principal.fromActor(Gamerholic), id, cyclesFromRake);
        
        settlementsCh.put(id, { settlement with winner = winner });
        challenges.put(id, { c with status = 5 });
        true
      }
    }
  };

  // Minimal gamer profile APIs for frontend
  public func upsertGamer(a : Address, username : Text, avatarUrl : Text) : async () {
    switch (gamers.get(a)) {
      case (?g) {
        let updated = { g with username = username; avatarUrl = avatarUrl };
        gamers.put(a, updated);
      };
      case null {
        let now = Nat64.fromNat(Int.abs(Time.now()));
        let defaultGamer : Gamer = {
          wallet = a;
          username = username;
          avatarUrl = avatarUrl;
          baseRake = 800;
          totalGamesPlayed = 0;
          totalTournamentsHosted = 0;
          disputeWinRate = 0;
          upvotes = 0;
          penaltyMultiplier = 1;
          wins = 0;
          losses = 0;
          currentWinStreak = 0;
          currentLossStreak = 0;
          longestWinStreak = 0;
          longestLossStreak = 0;
          gameRecords = [];
          totalHeadsUpEarnings = 0;
          totalHeadsUpLosses = 0;
          totalTournamentEarnings = 0;
          totalTournamentLosses = 0;
          tournamentWins = 0;
          tournamentLosses = 0;
          earningsByToken = [];
        };
        gamers.put(a, defaultGamer);
      }
    }
  };

  public query func getGamer(a : Address) : async ?{ wallet : Address; username : Text; avatarUrl : Text } {
    switch (gamers.get(a)) {
      case (?g) ?{ wallet = g.wallet; username = g.username; avatarUrl = g.avatarUrl };
      case null null;
    }
  };

  public query func listGamers() : async [{ wallet : Address; username : Text; avatarUrl : Text }] {
    var xs : [{ wallet : Address; username : Text; avatarUrl : Text }] = [];
    for (g in gamers.vals()) {
      xs := Array.append(xs, [{ wallet = g.wallet; username = g.username; avatarUrl = g.avatarUrl }]);
    };
    xs
  };

  public query func searchGamersUsernameLike(q : Text) : async [{ wallet : Address; username : Text; avatarUrl : Text }] {
    var xs : [{ wallet : Address; username : Text; avatarUrl : Text }] = [];
    for (g in gamers.vals()) {
      if (Text.contains(g.username, #text q)) {
        xs := Array.append(xs, [{ wallet = g.wallet; username = g.username; avatarUrl = g.avatarUrl }]);
      }
    };
    xs
  };

  public func setGamerProfileMeta(a : Address, meta : Text) : async Bool {
    gamerProfileMeta.put(a, meta);
    true
  };

  public query func getGamerProfileMeta(a : Address) : async ?Text { gamerProfileMeta.get(a) };

  // Update gamer statistics when a challenge is completed
  func updateGamerStatistics(winner : Address, loser : Address, gameType : Text, entryFee : Nat) : () {
    // Only update statistics for games with minimum wager (daily min bet requirement)
    let minBet = switch (minBetByGame.get(gameType)) {
      case (?bet) bet;
      case null 0;
    };
    
    if (entryFee >= minBet and minBet > 0) {
      // Update winner statistics
      switch (gamers.get(winner)) {
        case (?winnerGamer) {
          let newWins = winnerGamer.wins + 1;
          let newCurrentWinStreak = winnerGamer.currentWinStreak + 1;
          let newCurrentLossStreak = 0;
          let newLongestWinStreak = if (newCurrentWinStreak > winnerGamer.longestWinStreak) { newCurrentWinStreak } else { winnerGamer.longestWinStreak };
          
          // Update per-game records
          var updatedGameRecords = winnerGamer.gameRecords;
          var foundGame = false;
          var newRecords : [(Text, { wins : Nat; losses : Nat; winStreak : Nat; lossStreak : Nat })] = [];
          
          for ((game, record) in updatedGameRecords.vals()) {
            if (game == gameType) {
              foundGame := true;
              let newGameWins = record.wins + 1;
              let newGameWinStreak = record.winStreak + 1;
              let newGameLossStreak = 0;
              newRecords := Array.append<(Text, { wins : Nat; losses : Nat; winStreak : Nat; lossStreak : Nat })>(newRecords, [(game, { wins = newGameWins; losses = record.losses; winStreak = newGameWinStreak; lossStreak = newGameLossStreak })]);
            } else {
              newRecords := Array.append<(Text, { wins : Nat; losses : Nat; winStreak : Nat; lossStreak : Nat })>(newRecords, [(game, record)]);
            };
          };
          
          if (not foundGame) {
            newRecords := Array.append<(Text, { wins : Nat; losses : Nat; winStreak : Nat; lossStreak : Nat })>(newRecords, [(gameType, { wins = 1; losses = 0; winStreak = 1; lossStreak = 0 })]);
          };
          
          gamers.put(winner, {
            wallet = winnerGamer.wallet;
            username = winnerGamer.username;
            avatarUrl = winnerGamer.avatarUrl;
            baseRake = winnerGamer.baseRake;
            totalGamesPlayed = winnerGamer.totalGamesPlayed + 1;
            totalTournamentsHosted = winnerGamer.totalTournamentsHosted;
            disputeWinRate = winnerGamer.disputeWinRate;
            upvotes = winnerGamer.upvotes;
            penaltyMultiplier = winnerGamer.penaltyMultiplier;
            wins = newWins;
            losses = winnerGamer.losses;
            currentWinStreak = newCurrentWinStreak;
            currentLossStreak = newCurrentLossStreak;
            longestWinStreak = newLongestWinStreak;
            longestLossStreak = winnerGamer.longestLossStreak;
            gameRecords = newRecords;
            earningsByToken = winnerGamer.earningsByToken;
            totalHeadsUpEarnings = winnerGamer.totalHeadsUpEarnings;
            totalHeadsUpLosses = winnerGamer.totalHeadsUpLosses;
            totalTournamentEarnings = winnerGamer.totalTournamentEarnings;
            totalTournamentLosses = winnerGamer.totalTournamentLosses;
            tournamentWins = winnerGamer.tournamentWins;
            tournamentLosses = winnerGamer.tournamentLosses;
          });
        };
        case null {};
      };
      
      // Update loser statistics
      switch (gamers.get(loser)) {
        case (?loserGamer) {
          let newLosses = loserGamer.losses + 1;
          let newCurrentWinStreak = 0;
          let newCurrentLossStreak = loserGamer.currentLossStreak + 1;
          let newLongestLossStreak = if (newCurrentLossStreak > loserGamer.longestLossStreak) { newCurrentLossStreak } else { loserGamer.longestLossStreak };
          
          // Update per-game records
          var updatedGameRecords = loserGamer.gameRecords;
          var foundGame = false;
          var newRecords : [(Text, { wins : Nat; losses : Nat; winStreak : Nat; lossStreak : Nat })] = [];
          
          for ((game, record) in updatedGameRecords.vals()) {
            if (game == gameType) {
              foundGame := true;
              let newGameLosses = record.losses + 1;
              let newGameWinStreak = 0;
              let newGameLossStreak = record.lossStreak + 1;
              newRecords := Array.append<(Text, { wins : Nat; losses : Nat; winStreak : Nat; lossStreak : Nat })>(newRecords, [(game, { wins = record.wins; losses = newGameLosses; winStreak = newGameWinStreak; lossStreak = newGameLossStreak })]);
            } else {
              newRecords := Array.append<(Text, { wins : Nat; losses : Nat; winStreak : Nat; lossStreak : Nat })>(newRecords, [(game, record)]);
            };
          };
          
          if (not foundGame) {
            newRecords := Array.append<(Text, { wins : Nat; losses : Nat; winStreak : Nat; lossStreak : Nat })>(newRecords, [(gameType, { wins = 0; losses = 1; winStreak = 0; lossStreak = 1 })]);
          };
          
          gamers.put(loser, {
            wallet = loserGamer.wallet;
            username = loserGamer.username;
            avatarUrl = loserGamer.avatarUrl;
            baseRake = loserGamer.baseRake;
            totalGamesPlayed = loserGamer.totalGamesPlayed + 1;
            totalTournamentsHosted = loserGamer.totalTournamentsHosted;
            disputeWinRate = loserGamer.disputeWinRate;
            upvotes = loserGamer.upvotes;
            penaltyMultiplier = loserGamer.penaltyMultiplier;
            wins = loserGamer.wins;
            losses = newLosses;
            currentWinStreak = newCurrentWinStreak;
            currentLossStreak = newCurrentLossStreak;
            longestWinStreak = loserGamer.longestWinStreak;
            longestLossStreak = newLongestLossStreak;
            gameRecords = newRecords;
            earningsByToken = loserGamer.earningsByToken;
            totalHeadsUpEarnings = loserGamer.totalHeadsUpEarnings;
            totalHeadsUpLosses = loserGamer.totalHeadsUpLosses;
            totalTournamentEarnings = loserGamer.totalTournamentEarnings;
            totalTournamentLosses = loserGamer.totalTournamentLosses;
            tournamentWins = loserGamer.tournamentWins;
            tournamentLosses = loserGamer.tournamentLosses;
          });
        };
        case null {};
      };
    };
  };

  public query func getChallengeSettlement(id : ChallengeId) : async ?Settlement { settlementsCh.get(id) };

  // Gamer statistics functions
  public query func getGamerStats(address : Address) : async ?{
    wins : Nat;
    losses : Nat;
    winRate : Nat;
    currentWinStreak : Nat;
    currentLossStreak : Nat;
    longestWinStreak : Nat;
    longestLossStreak : Nat;
    totalGamesPlayed : Nat;
    gameRecords : [(Text, { wins : Nat; losses : Nat; winStreak : Nat; lossStreak : Nat })];
  } {
    switch (gamers.get(address)) {
      case (?gamer) {
        let totalGames = gamer.wins + gamer.losses;
        let winRate = if (totalGames > 0) { (gamer.wins * 100) / totalGames } else { 0 };
        ?{
          wins = gamer.wins;
          losses = gamer.losses;
          winRate = winRate;
          currentWinStreak = gamer.currentWinStreak;
          currentLossStreak = gamer.currentLossStreak;
          longestWinStreak = gamer.longestWinStreak;
          longestLossStreak = gamer.longestLossStreak;
          totalGamesPlayed = totalGames;
          gameRecords = gamer.gameRecords;
        }
      };
      case null null;
    }
  };

  public query func getGamerGameStats(address : Address, gameType : Text) : async ?{
    wins : Nat;
    losses : Nat;
    winRate : Nat;
    winStreak : Nat;
    lossStreak : Nat;
  } {
    switch (gamers.get(address)) {
      case (?gamer) {
        var gameStats : ?{ wins : Nat; losses : Nat; winStreak : Nat; lossStreak : Nat } = null;
        for ((game, record) in gamer.gameRecords.vals()) {
          if (game == gameType) {
            gameStats := ?record;
          };
        };
        switch (gameStats) {
          case (?stats) {
            let totalGames = stats.wins + stats.losses;
            let winRate = if (totalGames > 0) { (stats.wins * 100) / totalGames } else { 0 };
            ?{
              wins = stats.wins;
              losses = stats.losses;
              winRate = winRate;
              winStreak = stats.winStreak;
              lossStreak = stats.lossStreak;
            }
          };
          case null ?{ wins = 0; losses = 0; winRate = 0; winStreak = 0; lossStreak = 0 };
        }
      };
      case null null;
    }
  };

  public query func getGamerEarnings(address : Address) : async ?{
    totalHeadsUpEarnings : Nat;
    totalHeadsUpLosses : Nat;
    totalTournamentEarnings : Nat;
    totalTournamentLosses : Nat;
    tournamentWins : Nat;
    tournamentLosses : Nat;
    netProfit : Int;
    profitMargin : Nat;
    earningsByToken : [(Text, { headsUpEarnings : Nat; headsUpLosses : Nat; tournamentEarnings : Nat; tournamentLosses : Nat })];
  } {
    switch (gamers.get(address)) {
      case (?gamer) {
        let totalEarnings = gamer.totalHeadsUpEarnings + gamer.totalTournamentEarnings;
        let totalLosses = gamer.totalHeadsUpLosses + gamer.totalTournamentLosses;
        let netProfit = 0;
        let profitMargin = if (totalEarnings + totalLosses > 0) {
          (totalEarnings * 100) / (totalEarnings + totalLosses)
        } else { 0 };
        
        ?{
          totalHeadsUpEarnings = gamer.totalHeadsUpEarnings;
          totalHeadsUpLosses = gamer.totalHeadsUpLosses;
          totalTournamentEarnings = gamer.totalTournamentEarnings;
          totalTournamentLosses = gamer.totalTournamentLosses;
          tournamentWins = gamer.tournamentWins;
          tournamentLosses = gamer.tournamentLosses;
          netProfit = netProfit;
          profitMargin = profitMargin;
          earningsByToken = gamer.earningsByToken;
        }
      };
      case null null;
    }
  };

  public query func getGamerTokenEarnings(address : Address, token : Text) : async ?{
    headsUpEarnings : Nat;
    headsUpLosses : Nat;
    tournamentEarnings : Nat;
    tournamentLosses : Nat;
    netProfit : Int;
  } {
    switch (gamers.get(address)) {
      case (?gamer) {
        var tokenEarnings : ?{ headsUpEarnings : Nat; headsUpLosses : Nat; tournamentEarnings : Nat; tournamentLosses : Nat } = null;
        for ((tokenSymbol, earnings) in gamer.earningsByToken.vals()) {
          if (tokenSymbol == token) {
            tokenEarnings := ?earnings;
          };
        };
        switch (tokenEarnings) {
          case (?earnings) {
            let totalEarnings = earnings.headsUpEarnings + earnings.tournamentEarnings;
            let totalLosses = earnings.headsUpLosses + earnings.tournamentLosses;
            let netProfit = 0;
            ?{
              headsUpEarnings = earnings.headsUpEarnings;
              headsUpLosses = earnings.headsUpLosses;
              tournamentEarnings = earnings.tournamentEarnings;
              tournamentLosses = earnings.tournamentLosses;
              netProfit = netProfit;
            }
          };
          case null ?{ headsUpEarnings = 0; headsUpLosses = 0; tournamentEarnings = 0; tournamentLosses = 0; netProfit = 0 };
        }
      };
      case null null;
    }
  };

  // Video recording system for disputes
  type VideoEvidence = {
    disputeId : ChallengeId;
    uploader : Address;
    uploadTime : Nat64;
    videoHash : Text; // IPFS hash or similar
    description : Text;
  };

  transient let videoEvidences = HashMap.HashMap<ChallengeId, [VideoEvidence]>(256, Text.equal, Text.hash);

  public func uploadVideoEvidence(disputeId : ChallengeId, uploader : Address, videoHash : Text, description : Text) : async Bool {
    // Check if dispute exists
    switch (disputes.get(disputeId)) {
      case null { return false };
      case (?dispute) {
        if (dispute.status != #Active) { return false }; // Can only upload for active disputes
        
        let now = Nat64.fromNat(Int.abs(Time.now()));
        let evidence : VideoEvidence = {
          disputeId = disputeId;
          uploader = uploader;
          uploadTime = now;
          videoHash = videoHash;
          description = description;
        };
        
        switch (videoEvidences.get(disputeId)) {
          case (?currentEvidences) {
            let updatedEvidences = Array.append<VideoEvidence>(currentEvidences, [evidence]);
            videoEvidences.put(disputeId, updatedEvidences);
          };
          case null {
            videoEvidences.put(disputeId, [evidence]);
          };
        };
        
        true
      }
    }
  };

  public query func getVideoEvidences(disputeId : ChallengeId) : async [VideoEvidence] {
    switch (videoEvidences.get(disputeId)) {
      case (?evidences) evidences;
      case null [];
    }
  };

  public query func getDisputeWithEvidence(disputeId : ChallengeId) : async ?{
    dispute : Dispute;
    evidences : [VideoEvidence];
  } {
    switch (disputes.get(disputeId)) {
      case (?dispute) {
        let evidences = switch (videoEvidences.get(disputeId)) {
          case (?evs) evs;
          case null [];
        };
        ?{ dispute = dispute; evidences = evidences }
      };
      case null null;
    }
  };

  // Helper function to update gamer earnings
  func updateGamerEarnings(
    gamerAddress : Address, 
    isTournament : Bool, 
    isWin : Bool, 
    amount : Nat, 
    tokenType : Text
  ) : () {
    switch (gamers.get(gamerAddress)) {
      case (?gamer) {
        let baseUpdated = if (isTournament) {
          if (isWin) {
            { gamer with totalTournamentEarnings = gamer.totalTournamentEarnings + amount; tournamentWins = gamer.tournamentWins + 1 }
          } else {
            { gamer with totalTournamentLosses = gamer.totalTournamentLosses + amount; tournamentLosses = gamer.tournamentLosses + 1 }
          }
        } else {
          if (isWin) {
            { gamer with totalHeadsUpEarnings = gamer.totalHeadsUpEarnings + amount }
          } else {
            { gamer with totalHeadsUpLosses = gamer.totalHeadsUpLosses + amount }
          }
        };

        var foundToken = false;
        var newEarningsByToken : [(Text, { headsUpEarnings : Nat; headsUpLosses : Nat; tournamentEarnings : Nat; tournamentLosses : Nat })] = [];
        for ((token, earnings) in baseUpdated.earningsByToken.vals()) {
          if (token == tokenType) {
            foundToken := true;
            let updatedEarnings = if (isTournament) {
              if (isWin) {
                { headsUpEarnings = earnings.headsUpEarnings; headsUpLosses = earnings.headsUpLosses; tournamentEarnings = earnings.tournamentEarnings + amount; tournamentLosses = earnings.tournamentLosses }
              } else {
                { headsUpEarnings = earnings.headsUpEarnings; headsUpLosses = earnings.headsUpLosses; tournamentEarnings = earnings.tournamentEarnings; tournamentLosses = earnings.tournamentLosses + amount }
              }
            } else {
              if (isWin) {
                { headsUpEarnings = earnings.headsUpEarnings + amount; headsUpLosses = earnings.headsUpLosses; tournamentEarnings = earnings.tournamentEarnings; tournamentLosses = earnings.tournamentLosses }
              } else {
                { headsUpEarnings = earnings.headsUpEarnings; headsUpLosses = earnings.headsUpLosses + amount; tournamentEarnings = earnings.tournamentEarnings; tournamentLosses = earnings.tournamentLosses }
              }
            };
            newEarningsByToken := Array.append<(Text, { headsUpEarnings : Nat; headsUpLosses : Nat; tournamentEarnings : Nat; tournamentLosses : Nat })>(newEarningsByToken, [(token, updatedEarnings)]);
          } else {
            newEarningsByToken := Array.append<(Text, { headsUpEarnings : Nat; headsUpLosses : Nat; tournamentEarnings : Nat; tournamentLosses : Nat })>(newEarningsByToken, [(token, earnings)]);
          };
        };

        if (not foundToken) {
          let newEarnings = if (isTournament) {
            if (isWin) {
              { headsUpEarnings = 0; headsUpLosses = 0; tournamentEarnings = amount; tournamentLosses = 0 }
            } else {
              { headsUpEarnings = 0; headsUpLosses = 0; tournamentEarnings = 0; tournamentLosses = amount }
            }
          } else {
            if (isWin) {
              { headsUpEarnings = amount; headsUpLosses = 0; tournamentEarnings = 0; tournamentLosses = 0 }
            } else {
              { headsUpEarnings = 0; headsUpLosses = amount; tournamentEarnings = 0; tournamentLosses = 0 }
            }
          };
          newEarningsByToken := Array.append<(Text, { headsUpEarnings : Nat; headsUpLosses : Nat; tournamentEarnings : Nat; tournamentLosses : Nat })>(newEarningsByToken, [(tokenType, newEarnings)]);
        };

        let finalGamer = { baseUpdated with earningsByToken = newEarningsByToken };
        gamers.put(gamerAddress, finalGamer);
      };
      case null {};
    }
  };
  // Helper function to encode bytes as hex string
  func hexEncode(bytes : [Nat8]) : Text {
    var result = "";
    for (byte in bytes.vals()) {
      let high = byte / 16;
      let low = byte % 16;
      result := result # (switch (high) {
        case (0) "0";
        case (1) "1";
        case (2) "2";
        case (3) "3";
        case (4) "4";
        case (5) "5";
        case (6) "6";
        case (7) "7";
        case (8) "8";
        case (9) "9";
        case (10) "a";
        case (11) "b";
        case (12) "c";
        case (13) "d";
        case (14) "e";
        case (15) "f";
        case (_) "0";
      }) # (switch (low) {
        case (0) "0";
        case (1) "1";
        case (2) "2";
        case (3) "3";
        case (4) "4";
        case (5) "5";
        case (6) "6";
        case (7) "7";
        case (8) "8";
        case (9) "9";
        case (10) "a";
        case (11) "b";
        case (12) "c";
        case (13) "d";
        case (14) "e";
        case (15) "f";
        case (_) "0";
      });
    };
    result
  };

  // Ledger deposit verification and transfer functions
  public func verifyChallengeDepositICP(id : ChallengeId, expectedAmount : Nat) : async Bool {
    switch (challenges.get(id)) {
      case null { return false };
      case (?challenge) {
        // Get the deposit subaccount for this challenge
        let depositSubaccount = subFromText(id);
        
        // Convert expected amount to ICP decimals (8 decimals)
        let expectedAmountInE8s = Nat64.fromNat(expectedAmount * 100_000_000);
        
        // Query the ICP ledger for the balance in the challenge subaccount
        try {
          let accountBalance = await icpLedgerActor().account_balance({ account = depositSubaccount });
          accountBalance.e8s >= expectedAmountInE8s
        } catch (_) { false }
      }
    }
  };

  public func verifyChallengeDepositICRC(id : ChallengeId, tokenId : Text, expectedAmount : Nat) : async Bool {
    switch (challenges.get(id)) {
      case null { return false };
      case (?challenge) {
        // Check if token is supported
        if (not isTokenSupported(tokenId)) { return false };
        
        // Get the deposit address for this challenge
        let depositAddress = await getChallengeDepositAddressICRC(id, tokenId);
        
        // Parse the deposit address to get principal and subaccount
        let parts = Text.split(depositAddress, #char '/');
        var principalText = "";
        var subaccountHex = "";
        var currentPart = 0;
        var foundPrincipal = false;
        
        for (part in parts) {
          if (part == "icrc:") { currentPart := 1 } 
          else if (currentPart == 1 and part != "") { 
            principalText := part;
            currentPart := 2; 
            foundPrincipal := true;
          }
          else if (currentPart == 2 and part != "") { 
            subaccountHex := part;
            currentPart := 3; 
          }
        };
        
        if (not foundPrincipal or subaccountHex == "") { return false };
        
        let ownerPrincipal = Principal.fromText(principalText);
        let subaccount = hexDecode(subaccountHex);
        
        // Convert expected amount to token decimals
        let expectedAmountInDecimals = convertToTokenDecimals(expectedAmount, tokenId);
        
        // Query the ledger for the actual balance
        switch (icrcLedgers.get(tokenId)) {
          case (?ledger) {
            try {
              let actualBalance = await ledger.icrc1_balance_of({ owner = ownerPrincipal; subaccount = ?subaccount });
              actualBalance >= expectedAmountInDecimals
            } catch (_) { false }
          };
          case null false;
        }
      }
    }
  };

  public func transferChallengePrizeICP(id : ChallengeId, winner : Address, amount : Nat) : async Bool {
    switch (challenges.get(id)) {
      case null { return false };
      case (?challenge) {
        // Convert amount to ICP decimals (8 decimals)
        let amountInE8s = Nat64.fromNat(amount * 100_000_000);
        
        // Get the challenge's deposit subaccount
        let challengeSubaccount = subFromText(id);
        
        // Parse winner address to get principal
        // For ICP, we expect the winner address to be a principal
        let winnerPrincipal = Principal.fromText(winner);
        
        // Convert principal to account identifier (32 bytes)
        let winnerAccount = principalToAccountIdentifier(winnerPrincipal, null);
        
        // Transfer ICP from challenge subaccount to winner
        try {
        let result = await icpLedgerActor().transfer({
            to = winnerAccount;
            amount = { e8s = amountInE8s };
            fee = { e8s = 10_000 }; // ICP transfer fee
            memo = Nat64.fromNat(Int.abs(Time.now()));
            from_subaccount = ?challengeSubaccount;
            created_at_time = ?Nat64.fromNat(Int.abs(Time.now()));
          });
          true // For now, assume success since we can't pattern match on the result type
        } catch (_) { false }
      }
    }
  };

  public func transferChallengePrizeICRC(id : ChallengeId, tokenId : Text, winner : Address, amount : Nat) : async Bool {
    switch (challenges.get(id)) {
      case null { return false };
      case (?challenge) {
        // Check if token is supported
        if (not isTokenSupported(tokenId)) { return false };
        
        // Convert amount to token decimals
        let amountInDecimals = convertToTokenDecimals(amount, tokenId);
        
        // Get token info for fee
        switch (supportedTokens.get(tokenId)) {
          case (?tokenInfo) {
            // Parse winner address to get principal and subaccount
            let winnerParts = Text.split(winner, #char '/');
            var winnerPrincipalText = "";
            var winnerSubaccountHex = "";
            var currentPart = 0;
            var foundWinnerPrincipal = false;
            
            for (part in winnerParts) {
              if (part == "icrc:") { currentPart := 1 } 
              else if (currentPart == 1 and part != "") { 
                winnerPrincipalText := part;
                currentPart := 2; 
                foundWinnerPrincipal := true;
              }
              else if (currentPart == 2 and part != "") { 
                winnerSubaccountHex := part;
                currentPart := 3; 
              }
            };
            
            if (not foundWinnerPrincipal) { return false };
            
            let winnerPrincipal = Principal.fromText(winnerPrincipalText);
            let winnerSubaccount = if (winnerSubaccountHex == "") { null } else { ?hexDecode(winnerSubaccountHex) };
            
            // Get the challenge's deposit subaccount
            let challengeSubaccount = subFromText(id);
            
            // Transfer tokens from challenge subaccount to winner
            switch (icrcLedgers.get(tokenId)) {
              case (?ledger) {
                try {
                  let result = await ledger.icrc1_transfer({
                    from_subaccount = ?challengeSubaccount;
                    to = { owner = winnerPrincipal; subaccount = winnerSubaccount };
                    amount = amountInDecimals;
                    fee = ?tokenInfo.fee;
                    memo = null;
                    created_at_time = ?Nat64.fromNat(Int.abs(Time.now()));
                  });
                  true // For now, assume success since we can't pattern match on the result type
                } catch (_) { false }
              };
              case null false;
            }
          };
          case null false;
        }
      }
    }
  };

  public query func getChallengeDepositAddressICP(id : ChallengeId) : async Text { 
    let subaccount = subFromText(id);
    let principal = Principal.fromActor(Gamerholic);
    "icp://" # Principal.toText(principal) # "/" # hexEncode(subaccount)
  };
  
  public query func getChallengeDepositAddressICRC(id : ChallengeId, tokenId : Text) : async Text { 
    let subaccount = subFromText(id);
    let principal = Principal.fromActor(Gamerholic);
    "icrc://" # tokenId # "/" # Principal.toText(principal) # "/" # hexEncode(subaccount)
  };
  public query func getChallengeAccountOwner(_id : ChallengeId) : async Text {
    Principal.toText(Principal.fromActor(Gamerholic))
  };

  // Derive a deterministic 32-byte subaccount from text
  func subFromText(t : Text) : [Nat8] {
    let hash = Blob.toArray(Text.encodeUtf8(t));
    let padded = Array.tabulate<Nat8>(32, func(i) {
      if (i < hash.size()) { hash[i] } else { 0 }
    });
    padded
  };

  // Convert principal to account identifier (for ICP ledger)
  func principalToAccountIdentifier(principal: Principal, subaccount: ?[Nat8]) : [Nat8] {
    let principalBytes = Blob.toArray(Principal.toBlob(principal));
    let subaccountBytes = switch (subaccount) {
      case (?sub) sub;
      case null Array.tabulate<Nat8>(32, func(i) { 0 });
    };
    
    let combined = Array.append<Nat8>(principalBytes, subaccountBytes);
    Array.tabulate<Nat8>(32, func(i) {
      if (i < combined.size()) { combined[i] } else { 0 }
    })
  };

  // Funding state tracking
  transient let challengeFunding = HashMap.HashMap<ChallengeId, { challengerFunded: Bool; opponentFunded: Bool }>(256, Text.equal, Text.hash);
  transient let tournamentPayments = HashMap.HashMap<TournamentId, [Address]>(256, Text.equal, Text.hash);

  public query func getChallengeFundedState(id : ChallengeId) : async { challengerFunded: Bool; opponentFunded: Bool } {
    switch (challengeFunding.get(id)) {
      case (?s) s;
      case null { { challengerFunded = false; opponentFunded = false } };
    }
  };

  public query func getTournamentPaid(id : TournamentId, addr : Address) : async Bool {
    switch (tournamentPayments.get(id)) {
      case (?xs) {
        for (a in xs.vals()) { if (a == addr) { return true } };
        false
      };
      case null false;
    }
  };

  // WICP debit helpers (ICRC-2 transfer_from)
  public func debitChallengeWICP(id : ChallengeId, from : Principal, amount : Nat) : async Bool {
    if (not isTokenSupported("WICP")) { return false };
    let amt = convertToTokenDecimals(amount, "WICP");
    let sub = subFromText(id);
    ignore ensureIcrcLedgerActor("WICP");
    switch (supportedTokens.get("WICP")) {
      case (?info) {
        switch (icrcLedgers.get("WICP")) {
          case (?ledger) {
            try {
              let res = await ledger.icrc2_transfer_from({
                from = { owner = from; subaccount = null };
                to = { owner = Principal.fromActor(Gamerholic); subaccount = ?sub };
                amount = amt;
                fee = ?info.fee;
                memo = ?Text.encodeUtf8(id);
                created_at_time = ?Nat64.fromNat(Int.abs(Time.now()));
                spender_subaccount = null
              });
              challengeFunding.put(id, { challengerFunded = true; opponentFunded = switch (challengeFunding.get(id)) { case (?s) s.opponentFunded; case null false } });
              true
            } catch (_) { false }
          };
          case null false;
        }
      };
      case null false;
    }
  };

  public func debitChallengeOpponentWICP(id : ChallengeId, from : Principal, amount : Nat) : async Bool {
    if (not isTokenSupported("WICP")) { return false };
    let amt = convertToTokenDecimals(amount, "WICP");
    let sub = subFromText(id);
    ignore ensureIcrcLedgerActor("WICP");
    switch (supportedTokens.get("WICP")) {
      case (?info) {
        switch (icrcLedgers.get("WICP")) {
          case (?ledger) {
            try {
              let res = await ledger.icrc2_transfer_from({
                from = { owner = from; subaccount = null };
                to = { owner = Principal.fromActor(Gamerholic); subaccount = ?sub };
                amount = amt;
                fee = ?info.fee;
                memo = ?Text.encodeUtf8(id # "_opp");
                created_at_time = ?Nat64.fromNat(Int.abs(Time.now()));
                spender_subaccount = null
              });
              let prev = switch (challengeFunding.get(id)) { case (?s) s; case null { { challengerFunded = false; opponentFunded = false } } };
              challengeFunding.put(id, { challengerFunded = prev.challengerFunded; opponentFunded = true });
              true
            } catch (_) { false }
          };
          case null false;
        }
      };
      case null false;
    }
  };

  public func debitTournamentWICP(id : TournamentId, from : Principal, amount : Nat) : async Bool {
    if (not isTokenSupported("WICP")) { return false };
    let amt = convertToTokenDecimals(amount, "WICP");
    let sub = subFromText(id);
    ignore ensureIcrcLedgerActor("WICP");
    switch (supportedTokens.get("WICP")) {
      case (?info) {
        switch (icrcLedgers.get("WICP")) {
          case (?ledger) {
            try {
              let res = await ledger.icrc2_transfer_from({
                from = { owner = from; subaccount = null };
                to = { owner = Principal.fromActor(Gamerholic); subaccount = ?sub };
                amount = amt;
                fee = ?info.fee;
                memo = ?Text.encodeUtf8(id);
                created_at_time = ?Nat64.fromNat(Int.abs(Time.now()));
                spender_subaccount = null
              });
              let list = switch (tournamentPayments.get(id)) { case (?xs) xs; case null [] };
              tournamentPayments.put(id, Array.append<Address>(list, [Principal.toText(from)]));
              true
            } catch (_) { false }
          };
          case null false;
        }
      };
      case null false;
    }
  };

  public func debitDonationWICP(from : Principal, amount : Nat, memoText : Text) : async Bool {
    if (not isTokenSupported("WICP")) { return false };
    let amt = convertToTokenDecimals(amount, "WICP");
    let sub = subFromText("treasury_wicp");
    ignore ensureIcrcLedgerActor("WICP");
    switch (supportedTokens.get("WICP")) {
      case (?info) {
        switch (icrcLedgers.get("WICP")) {
          case (?ledger) {
            try {
              let res = await ledger.icrc2_transfer_from({
                from = { owner = from; subaccount = null };
                to = { owner = Principal.fromActor(Gamerholic); subaccount = ?sub };
                amount = amt;
                fee = ?info.fee;
                memo = ?Text.encodeUtf8(memoText);
                created_at_time = ?Nat64.fromNat(Int.abs(Time.now()));
                spender_subaccount = null
              });
              let _txId = recordTreasuryTransaction(#Deposit, "WICP", amount, ?Principal.toText(from), null, null, null, "WICP donation");
              true
            } catch (_) { false }
          };
          case null false;
        }
      };
      case null false;
    }
  };

  // Tournament settlements
  transient let settlementsT = HashMap.HashMap<TournamentId, Settlement>(128, Text.equal, Text.hash);
  transient let settlementsCh = HashMap.HashMap<ChallengeId, Settlement>(256, Text.equal, Text.hash);
  transient let hostEarnings = HashMap.HashMap<Address, Nat>(256, Text.equal, Text.hash);
  transient let tournamentRounds = HashMap.HashMap<TournamentId, [[ChallengeId]]>(64, Text.equal, Text.hash);
  transient let tournamentSeeds = HashMap.HashMap<TournamentId, [(Address, Nat)]>(64, Text.equal, Text.hash);
  transient let tournamentBracketPositions = HashMap.HashMap<TournamentId, [(Address, ?ChallengeId, ?Address)]>(64, Text.equal, Text.hash);
  transient let tournamentBracketSeeds = HashMap.HashMap<TournamentId, [(Address, Nat)]>(64, Text.equal, Text.hash);
  transient let tournamentBracketProgression = HashMap.HashMap<TournamentId, [(Nat, Nat, Nat)]>(64, Text.equal, Text.hash); // (round, position, nextRoundPosition)

  // Monitoring and Operations Data Structures
  transient let systemMetrics = HashMap.HashMap<Text, SystemMetrics>(1, Text.equal, Text.hash);
  transient let performanceMetrics = HashMap.HashMap<Text, PerformanceMetrics>(1, Text.equal, Text.hash);
  transient let systemAlerts = HashMap.HashMap<Text, SystemAlert>(256, Text.equal, Text.hash);
  transient let systemAlertList = Buffer.Buffer<SystemAlert>(10);
  transient let userActivityLog = HashMap.HashMap<Address, [(Nat64, Text)]>(256, Text.equal, Text.hash); // (timestamp, activity)
  transient let systemStartTime = Nat64.fromNat(Int.abs(Time.now()));
  transient let challengeCompletionTimes = Buffer.Buffer<Nat64>(100);
  transient let tournamentCompletionTimes = Buffer.Buffer<Nat64>(50);

  /// When a tournament/challenge has a betable market, prize claim is blocked until host marks
  /// the market settled (market must be #resolved on betable first — FE enforces + this flag).
  public func markBetableSettled(entityId : Text, who : Address, settled : Bool) : async Bool {
    // entityId = tournament id or challenge id
    switch (tournaments.get(entityId)) {
      case (?t) {
        if (t.creator != who) { return false };
        if (not t.betable) { return false };
        betableSettledByEntity.put(entityId, settled);
        return true;
      };
      case null {};
    };
    switch (challenges.get(entityId)) {
      case (?c) {
        if (c.creator != who) { return false };
        if (not c.betable) { return false };
        betableSettledByEntity.put(entityId, settled);
        true
      };
      case null { false };
    }
  };

  public query func isBetableSettled(entityId : Text) : async Bool {
    switch (betableSettledByEntity.get(entityId)) {
      case (?v) { v };
      case null {
        // No market → treat as settled (claim not blocked by betable)
        switch (tournaments.get(entityId)) {
          case (?t) { not t.betable or t.marketId == "" };
          case null {
            switch (challenges.get(entityId)) {
              case (?c) { not c.betable or c.marketId == "" };
              case null { true };
            }
          };
        }
      };
    }
  };

  private func requireBetableSettled(entityId : Text, betable : Bool, marketId : Text) : Bool {
    if (not betable or marketId == "") { return true };
    switch (betableSettledByEntity.get(entityId)) {
      case (?true) { true };
      case _ { false };
    }
  };

  public func claimTournament(id : TournamentId, pot : Nat, winner : Address, serviceFee : Nat) : async Bool {
    switch (tournaments.get(id)) {
      case null { return false };
      case (?t) {
        // Team-entry brackets must use claimTournamentTeam
        if (t.teamEntry) { return false };
        if (t.status != 2 and t.status != 3) { return false }; // live completed or claimable
        // Block prize claim until betable market is marked settled
        if (not requireBetableSettled(id, t.betable, t.marketId)) { return false };
        let settlement = computeSettlement(pot, platformFeeRate);
        // Host fee from tournament hostFeeBps applied on pot before platform rake path
        let hostCut = (pot * t.hostFeeBps) / 10000;
        let afterHost = if (pot > hostCut) { pot - hostCut } else { 0 };
        let settlement2 = computeSettlement(afterHost, platformFeeRate);
        
        // Record treasury transactions for immutable audit trail
        let txId1 = recordTreasuryTransaction(
          #RakeCollection,
          t.payToken,
          settlement2.rake,
          ?t.creator,
          null,
          null,
          ?id,
          "Rake collected from tournament " # id
        );
        
        let txId2 = recordTreasuryTransaction(
          #PrizeDistribution,
          t.payToken,
          settlement2.pot,
          null,
          ?winner,
          null,
          ?id,
          "Prize distributed to winner of tournament " # id
        );

        ignore txId1;
        ignore txId2;
        ignore serviceFee;
        
        // Allocate cycles from rake (60% of rake goes to cycles)
        let cyclesFromRake = (settlement2.rake * 60) / 100;
        let _ = await allocateCycles(Principal.fromActor(Gamerholic), id, cyclesFromRake);
        
        // Update earnings tracking for tournament winner
        updateGamerEarnings(winner, true, true, settlement2.pot, t.payToken); // Winner earnings
        if (hostCut > 0) {
          updateGamerEarnings(t.creator, true, true, hostCut, t.payToken);
        };
        
        // Update tournament statistics for winner
        switch (gamers.get(winner)) {
          case (?gamer) {
            gamers.put(winner, { gamer with tournamentWins = gamer.tournamentWins + 1 });
          };
          case null {};
        };
        
        // Update losses for all participants who paid entry fees
        switch (tournamentParticipants.get(id)) {
          case (?participants) {
            for (participant in participants.vals()) {
              if (participant != winner) {
                updateGamerEarnings(participant, true, false, t.entryFee, t.payToken); // Participant losses (entry fee)
                
                // Update tournament statistics for participants
                switch (gamers.get(participant)) {
                  case (?gamer) {
                    gamers.put(participant, { gamer with tournamentLosses = gamer.tournamentLosses + 1 });
                  };
                  case null {};
                };
              };
            };
          };
          case null {};
        };
        
        settlementsT.put(id, { settlement2 with winner = winner; claimed = true });
        tournaments.put(id, { t with status = 3 });
        true
      }
    }
  };

  /// Preview team claim: each member's % of team prize pool (assigned at invite / setTeamWinSplits).
  public query func previewTeamTournamentClaim(
    id : TournamentId,
    pot : Nat,
    winningTeamId : TeamId,
  ) : async ?TeamClaimPreview {
    switch (tournaments.get(id)) {
      case null { null };
      case (?t) {
        if (not t.teamEntry) { return null };
        let hostCut = (pot * t.hostFeeBps) / 10000;
        let afterHost = if (pot > hostCut) { pot - hostCut } else { 0 };
        // Platform rake on remainder (legacy platformFeeRate as %)
        let rake = (afterHost * platformFeeRate) / 100;
        let teamPrize = if (afterHost > rake) { afterHost - rake } else { 0 };
        let splits = getTeamSplits(winningTeamId);
        let totalBps = teamSplitsTotal(splits);
        var lines : [TeamClaimLine] = [];
        for (s in splits.vals()) {
          let amt = if (totalBps == 10000) {
            (teamPrize * s.winSplitBps) / 10000
          } else { 0 };
          lines := Array.append(lines, [{
            member = s.member;
            winSplitBps = s.winSplitBps;
            amount = amt;
          }]);
        };
        ?{
          pot = pot;
          hostFeeBps = t.hostFeeBps;
          hostCut = hostCut;
          platformRake = rake;
          teamPrizePool = teamPrize;
          teamId = winningTeamId;
          lines = lines;
          splitsValid = totalBps == 10000;
          splitsTotalBps = totalBps;
        }
      };
    }
  };

  /// Claim team tournament: host cut + platform rake, then each roster member gets their win-split % of the team pool.
  public func claimTournamentTeam(
    id : TournamentId,
    pot : Nat,
    winningTeamId : TeamId,
    _serviceFee : Nat,
  ) : async Bool {
    switch (tournaments.get(id)) {
      case null { return false };
      case (?t) {
        if (not t.teamEntry) { return false };
        if (t.status != 2 and t.status != 3) { return false };
        if (not requireBetableSettled(id, t.betable, t.marketId)) { return false };
        switch (settlementsT.get(id)) {
          case (?s) { if (s.claimed) { return false } };
          case null {};
        };
        switch (teams.get(winningTeamId)) {
          case null { return false };
          case (?_) {};
        };
        let splits = getTeamSplits(winningTeamId);
        let totalBps = teamSplitsTotal(splits);
        if (totalBps != 10000) { return false }; // must be fully allocated

        let hostCut = (pot * t.hostFeeBps) / 10000;
        let afterHost = if (pot > hostCut) { pot - hostCut } else { 0 };
        let rake = (afterHost * platformFeeRate) / 100;
        let teamPrize = if (afterHost > rake) { afterHost - rake } else { 0 };

        ignore recordTreasuryTransaction(
          #RakeCollection,
          t.payToken,
          rake,
          ?t.creator,
          null,
          null,
          ?id,
          "Rake from team tournament " # id
        );

        // Pay each member their assigned %
        for (s in splits.vals()) {
          let amt = (teamPrize * s.winSplitBps) / 10000;
          if (amt > 0) {
            ignore recordTreasuryTransaction(
              #PrizeDistribution,
              t.payToken,
              amt,
              null,
              ?s.member,
              null,
              ?id,
              "Team split " # Nat.toText(s.winSplitBps) # "bps · " # winningTeamId # " · " # id
            );
            updateGamerEarnings(s.member, true, true, amt, t.payToken);
          };
        };

        if (hostCut > 0) {
          ignore recordTreasuryTransaction(
            #PrizeDistribution,
            t.payToken,
            hostCut,
            null,
            ?t.creator,
            null,
            ?id,
            "Host fee team tournament " # id
          );
          updateGamerEarnings(t.creator, true, true, hostCut, t.payToken);
        };

        // Mark team win
        await updateTeamStats(winningTeamId, true, teamPrize);
        tournamentWinningTeam.put(id, winningTeamId);

        let settlement = {
          pot = teamPrize;
          rakePercent = platformFeeRate;
          rake = rake;
          winner = winningTeamId; // team id stored as winner key for team claims
          claimed = true;
        };
        settlementsT.put(id, settlement);
        tournaments.put(id, { t with status = 3 });
        true
      };
    }
  };

  public query func getTournamentWinningTeam(id : TournamentId) : async ?TeamId {
    tournamentWinningTeam.get(id)
  };

  public query func getTournamentSettlement(id : TournamentId) : async ?Settlement { settlementsT.get(id) };
  public query func getHostEarnings(a : Address) : async Nat { switch (hostEarnings.get(a)) { case (?x) x; case null 0 } };
  
  // Tournament bracket management
  public func setTournamentBracket(id : TournamentId, bracket : [Address]) : async Bool {
    tournamentBracket.put(id, bracket);
    true
  };
  
  public query func getTournamentRounds(id : TournamentId) : async [[ChallengeId]] { 
    switch (tournamentRounds.get(id)) { case (?r) r; case null [] } 
  };
  
  public query func getTournamentWinners(id : TournamentId) : async [Address] { 
    switch (tournamentWinners.get(id)) { case (?w) w; case null [] } 
  };
  
  public query func getTournamentChildEscrows(id : TournamentId) : async [ChallengeId] { 
    switch (tournamentChildEscrows.get(id)) { case (?c) c; case null [] } 
  };
  
  public query func getTournamentStatus(id : TournamentId) : async Text {
    switch (tournaments.get(id)) {
      case null { "not_found" };
      case (?t) {
        switch (t.status) {
          case (0) "cancelled";
          case (1) "open";
          case (2) "in_progress";
          case (3) "completed";
          case (_) "unknown";
        }
      }
    }
  };
  
  public query func getTournamentBracketState(id : TournamentId) : async {
    status : Text;
    currentRound : Nat;
    totalRounds : Nat;
    participants : [Address];
    winners : [Address];
    seeds : [(Address, Nat)];
  } {
    switch (tournaments.get(id)) {
      case null {
        return {
          status = "not_found";
          currentRound = 0;
          totalRounds = 0;
          participants = [];
          winners = [];
          seeds = [];
        }
      };
      case (?t) {
        let participants = switch (tournamentParticipants.get(id)) { case (?xs) xs; case null [] };
        let winners = switch (tournamentWinners.get(id)) { case (?xs) xs; case null [] };
        let rounds = switch (tournamentRounds.get(id)) { case (?xs) xs; case null [] };
        let seeds = switch (tournamentBracketSeeds.get(id)) { case (?s) s; case null [] };
        
        return {
          status = switch (t.status) {
            case (0) "cancelled";
            case (1) "open";
            case (2) "in_progress";
            case (3) "completed";
            case (_) "unknown";
          };
          currentRound = rounds.size();
          totalRounds = if (participants.size() > 1) { 
            var rounds = 0;
            var players = participants.size();
            while (players > 1) {
              players := players / 2 + (players % 2);
              rounds := rounds + 1;
            };
            rounds
          } else { 0 };
          participants = participants;
          winners = winners;
          seeds = seeds;
        }
      }
    }
  };

  // Tournament deposit verification functions
  public func verifyTournamentDepositICP(id : TournamentId, expectedAmount : Nat) : async Bool {
    switch (tournaments.get(id)) {
      case null { return false };
      case (?tournament) {
        // Get the deposit subaccount for this tournament
        let depositSubaccount = subFromText(id);
        
        // Convert expected amount to ICP decimals (8 decimals)
        let expectedAmountInE8s = Nat64.fromNat(expectedAmount * 100_000_000);
        
        // Query the ICP ledger for the balance in the tournament subaccount
        try {
          let accountBalance = await icpLedgerActor().account_balance({ account = depositSubaccount });
          accountBalance.e8s >= expectedAmountInE8s
        } catch (_) { false }
      }
    }
  };

  public func verifyTournamentDepositICRC(id : TournamentId, tokenId : Text, expectedAmount : Nat) : async Bool {
    switch (tournaments.get(id)) {
      case null { return false };
      case (?tournament) {
        // Check if token is supported
        if (not isTokenSupported(tokenId)) { return false };
        
        // Get the deposit address for this tournament
        let depositAddress = await getTournamentDepositAddressICRC(id, tokenId);
        
        // Parse the deposit address to get principal and subaccount
        let parts = Text.split(depositAddress, #char '/');
        var principalText = "";
        var subaccountHex = "";
        var currentPart = 0;
        var foundPrincipal = false;
        
        for (part in parts) {
          if (part == "icrc:") { currentPart := 1 } 
          else if (currentPart == 1 and part != "") { 
            principalText := part;
            currentPart := 2; 
            foundPrincipal := true;
          }
          else if (currentPart == 2 and part != "") { 
            subaccountHex := part;
            currentPart := 3; 
          }
        };
        
        if (not foundPrincipal or subaccountHex == "") { return false };
        
        let ownerPrincipal = Principal.fromText(principalText);
        let subaccount = hexDecode(subaccountHex);
        
        // Convert expected amount to token decimals
        let expectedAmountInDecimals = convertToTokenDecimals(expectedAmount, tokenId);
        
        // Query the ledger for the actual balance
        switch (icrcLedgers.get(tokenId)) {
          case (?ledger) {
            try {
              let actualBalance = await ledger.icrc1_balance_of({ owner = ownerPrincipal; subaccount = ?subaccount });
              actualBalance >= expectedAmountInDecimals
            } catch (_) { false }
          };
          case null false;
        }
      }
    }
  };

  public func transferTournamentPrizeICP(id : TournamentId, winner : Address, amount : Nat) : async Bool {
    switch (tournaments.get(id)) {
      case null { return false };
      case (?tournament) {
        // Convert amount to ICP decimals (8 decimals)
        let amountInE8s = Nat64.fromNat(amount * 100_000_000);
        
        // Get the tournament's deposit subaccount
        let tournamentSubaccount = subFromText(id);
        
        // Parse winner address to get principal
        // For ICP, we expect the winner address to be a principal
        let winnerPrincipal = Principal.fromText(winner);
        
        // Convert principal to account identifier (32 bytes)
        let winnerAccount = principalToAccountIdentifier(winnerPrincipal, null);
        
        // Transfer ICP from tournament subaccount to winner
        try {
        let result = await icpLedgerActor().transfer({
            to = winnerAccount;
            amount = { e8s = amountInE8s };
            fee = { e8s = 10_000 }; // ICP transfer fee
            memo = Nat64.fromNat(Int.abs(Time.now()));
            from_subaccount = ?tournamentSubaccount;
            created_at_time = ?Nat64.fromNat(Int.abs(Time.now()));
          });
          true // For now, assume success since we can't pattern match on the result type
        } catch (_) { false }
      }
    }
  };

  public func transferTournamentPrizeICRC(id : TournamentId, tokenId : Text, winner : Address, amount : Nat) : async Bool {
    switch (tournaments.get(id)) {
      case null { return false };
      case (?tournament) {
        // Check if token is supported
        if (not isTokenSupported(tokenId)) { return false };
        
        // Convert amount to token decimals
        let amountInDecimals = convertToTokenDecimals(amount, tokenId);
        
        // Get token info for fee
        switch (supportedTokens.get(tokenId)) {
          case (?tokenInfo) {
            // Parse winner address to get principal and subaccount
            let winnerParts = Text.split(winner, #char '/');
            var winnerPrincipalText = "";
            var winnerSubaccountHex = "";
            var currentPart = 0;
            var foundWinnerPrincipal = false;
            
            for (part in winnerParts) {
              if (part == "icrc:") { currentPart := 1 } 
              else if (currentPart == 1 and part != "") { 
                winnerPrincipalText := part;
                currentPart := 2; 
                foundWinnerPrincipal := true;
              }
              else if (currentPart == 2 and part != "") { 
                winnerSubaccountHex := part;
                currentPart := 3; 
              }
            };
            
            if (not foundWinnerPrincipal) { return false };
            
            let winnerPrincipal = Principal.fromText(winnerPrincipalText);
            let winnerSubaccount = if (winnerSubaccountHex == "") { null } else { ?hexDecode(winnerSubaccountHex) };
            
            // Get the tournament's deposit subaccount
            let tournamentSubaccount = subFromText(id);
            
            // Transfer tokens from tournament subaccount to winner
            switch (icrcLedgers.get(tokenId)) {
              case (?ledger) {
                try {
                  let result = await ledger.icrc1_transfer({
                    from_subaccount = ?tournamentSubaccount;
                    to = { owner = winnerPrincipal; subaccount = winnerSubaccount };
                    amount = amountInDecimals;
                    fee = ?tokenInfo.fee;
                    memo = null;
                    created_at_time = ?Nat64.fromNat(Int.abs(Time.now()));
                  });
                  true // For now, assume success since we can't pattern match on the result type
                } catch (_) { false }
              };
              case null false;
            }
          };
          case null false;
        }
      }
    }
  };

  public query func getTournamentDepositAddressICP(id : TournamentId) : async Text { 
    let subaccount = subFromText(id);
    let principal = Principal.fromActor(Gamerholic);
    "icp://" # Principal.toText(principal) # "/" # hexEncode(subaccount)
  };
  
  public query func getTournamentDepositAddressICRC(id : TournamentId, tokenId : Text) : async Text { 
    let subaccount = subFromText(id);
    let principal = Principal.fromActor(Gamerholic);
    "icrc://" # tokenId # "/" # Principal.toText(principal) # "/" # hexEncode(subaccount)
  };
  public query func getTournamentAccountOwner(_id : TournamentId) : async Text {
    Principal.toText(Principal.fromActor(Gamerholic))
  };

  // Tournament audit and transparency functions
  public query func getTournamentRefunds(id : TournamentId) : async [TournamentRefundLog] {
    switch (tournamentRefunds.get(id)) {
      case (?logs) logs;
      case null [];
    }
  };

  public query func getTournamentModeratorActions(id : TournamentId) : async [ModeratorActionLog] {
    switch (moderatorActions.get(id)) {
      case (?logs) logs;
      case null [];
    }
  };

  public func startTournament(id : TournamentId) : async Bool {
    switch (tournaments.get(id)) {
      case null { return false };
      case (?t) {
        if (t.status != 1) { return false }; // Not open
        let participants = switch (tournamentParticipants.get(id)) { case (?xs) xs; case null [] };
        if (participants.size() < 2) { return false }; // Need at least 2 participants
        
        // Initialize bracket system
        let bracketSize = nextPowerOfTwo(participants.size());
        var bracket : [Address] = [];
        
        // Seed participants into bracket positions
        for (i in Iter.range(0, bracketSize - 1)) {
          if (i < participants.size()) {
            bracket := Array.append(bracket, [participants[i]]);
          } else {
            bracket := Array.append(bracket, [""]);
          };
        };
        
        // Set up bracket positions tracking
        var positions : [(Address, ?ChallengeId, ?Address)] = [];
        for (player in bracket.vals()) {
          positions := Array.append(positions, [(player, null, null)]);
        };
        
        // Store bracket data
        tournamentBracket.put(id, bracket);
        tournamentBracketPositions.put(id, positions);
        tournamentBracketProgression.put(id, []);
        
        // Create initial pairings for first round
        let success = await createInitialPairings(id);
        if (not success) { return false };
        
        tournaments.put(id, { t with status = 2 }); // Set to in_progress
        true
      }
    }
  };
  
  public func createInitialPairings(id : TournamentId) : async Bool {
    let parts = switch (tournamentParticipants.get(id)) { case (?xs) xs; case null [] };
    if (parts.size() < 2) { return false };
    
    // Simple single-elimination bracket creation
    var pairings : [[ChallengeId]] = [];
    var i = 0;
    while (i < parts.size()) {
      let p1 = parts[i];
      let p2 = if (i + 1 < parts.size()) { parts[i + 1] } else { "" };
      
      if (p2 != "") {
        let challengeId = await createHeadsUpChallenge(p1, 1, p2, "tournament", id, "ICP", "Tournament match");
        pairings := Array.append<[ChallengeId]>(pairings, [[challengeId]]);
      };
      
      i := i + 2;
    };
    
    tournamentRounds.put(id, pairings);
    true
  };

  public func advanceTournament(id : TournamentId, winners : [Address]) : async Bool {
    let rounds = switch (tournamentRounds.get(id)) { case (?r) r; case null [] };
    let bracket = switch (tournamentBracket.get(id)) { case (?b) b; case null [] };
    let bracketPositions = switch (tournamentBracketPositions.get(id)) { case (?bp) bp; case null [] };
    let progression = switch (tournamentBracketProgression.get(id)) { case (?p) p; case null [] };
    
    if (winners.size() == 0) { return false };
    
    // Check SLA deadline
    switch (tournaments.get(id)) {
      case null { return false };
      case (?tournament) {
        let now = Nat64.fromNat(Int.abs(Time.now()));
        if (now > tournament.deadline) { return false }; // Past SLA deadline
      }
    };
    
    // Add current winners to tournament winners
    let currentWinners = switch (tournamentWinners.get(id)) { case (?w) w; case null [] };
    let updatedWinners = Array.append<Address>(currentWinners, winners);
    tournamentWinners.put(id, updatedWinners);
    
    // Update bracket positions with winners and challenge results
    var updatedPositions : [(Address, ?ChallengeId, ?Address)] = [];
    var currentRoundIndex = rounds.size();
    
    // Update positions with completed challenges and winners
    for (i in Iter.range(0, bracketPositions.size() - 1)) {
      let (player, challengeId, winner) = bracketPositions[i];
      
      // Check if this position corresponds to a completed match in current round
      if (i < winners.size() * 2 and player != "") {
        // Find the winner for this match
        let matchIndex = i / 2;
        if (matchIndex < winners.size()) {
          updatedPositions := Array.append<(Address, ?ChallengeId, ?Address)>(updatedPositions, [(player, challengeId, ?winners[matchIndex])]);
        } else {
          updatedPositions := Array.append<(Address, ?ChallengeId, ?Address)>(updatedPositions, [(player, challengeId, winner)]);
        };
      } else {
        updatedPositions := Array.append<(Address, ?ChallengeId, ?Address)>(updatedPositions, [(player, challengeId, winner)]);
      };
    };
    
    tournamentBracketPositions.put(id, updatedPositions);
    
    // If only one winner remains, tournament is complete
    if (winners.size() == 1) {
      switch (tournaments.get(id)) {
        case null { return false };
        case (?t) {
          tournaments.put(id, { t with status = 3 }); // Completed
          
          // Update final bracket position
          var finalPositions : [(Address, ?ChallengeId, ?Address)] = [];
          for (pos in updatedPositions.vals()) {
            if (pos.0 != "") {
              finalPositions := Array.append<(Address, ?ChallengeId, ?Address)>(finalPositions, [(pos.0, pos.1, ?winners[0])]);
            };
          };
          tournamentBracketPositions.put(id, finalPositions);
          
          true
        }
      }
    } else {
      // Create next round pairings with proper bracket progression
      var nextRound : [ChallengeId] = [];
      var nextRoundPositions : [(Address, ?ChallengeId, ?Address)] = [];
      var i = 0;
      
      // Create matches for next round
      while (i < winners.size()) {
        let p1 = winners[i];
        let p2 = if (i + 1 < winners.size()) { winners[i + 1] } else { "" };
        
        if (p2 != "") {
          let challengeId = await createHeadsUpChallenge(p1, 1, p2, "tournament", id, "ICP", "Tournament match");
          nextRound := Array.append<ChallengeId>(nextRound, [challengeId]);
          
          // Add to next round positions
          nextRoundPositions := Array.append<(Address, ?ChallengeId, ?Address)>(nextRoundPositions, [(p1, ?challengeId, null)]);
          nextRoundPositions := Array.append<(Address, ?ChallengeId, ?Address)>(nextRoundPositions, [(p2, ?challengeId, null)]);
        } else {
          // Player gets a bye to next round
          nextRoundPositions := Array.append<(Address, ?ChallengeId, ?Address)>(nextRoundPositions, [(p1, null, ?p1)]);
        };
        
        i := i + 2;
      };
      
      let updatedRounds = Array.append(rounds, [nextRound]);
      tournamentRounds.put(id, updatedRounds);
      
      // Update bracket positions for next round
      var finalBracketPositions : [(Address, ?ChallengeId, ?Address)] = [];
      
      // Keep existing positions but add next round positions
      for (pos in updatedPositions.vals()) {
        finalBracketPositions := Array.append<(Address, ?ChallengeId, ?Address)>(finalBracketPositions, [pos]);
      };
      
      // Add next round positions
      for (nextPos in nextRoundPositions.vals()) {
        finalBracketPositions := Array.append<(Address, ?ChallengeId, ?Address)>(finalBracketPositions, [nextPos]);
      };
      
      tournamentBracketPositions.put(id, finalBracketPositions);
      true
    }
  };

  // ============================================
  // ROOM FUNCTIONALITY FOR GROUP PLAY CHALLENGES
  // ============================================

  // Room Management Functions
  public func createRoom(
    creator : Address,
    name : Text,
    description : Text,
    gameTypes : [Text],
    console : Text,
    rules : Text,
    imageUrl : Text
  ) : async RoomId {
    let id : RoomId = "room-" # Nat.toText(Int.abs(Time.now()));
    let now = Nat64.fromNat(Int.abs(Time.now()));
    
    let room : RoomInfo = {
      id = id;
      name = name;
      creator = creator;
      description = description;
      gameTypes = gameTypes;
      console = console;
      rules = rules;
      imageUrl = imageUrl;
      members = [creator];
      memberCount = 1;
      createdAt = now;
      isActive = true;
    };
    
    rooms.put(id, room);
    roomChallenges.put(id, []);
    id
  };

  public func joinRoom(roomId : RoomId, user : Address) : async Bool {
    switch (rooms.get(roomId)) {
      case (?room) {
        // Check if already a member
        for (member in room.members.vals()) {
          if (member == user) { return false };
        };
        
        let updatedMembers = Array.append<Address>(room.members, [user]);
        let updatedRoom = {
          room with
          members = updatedMembers;
          memberCount = room.memberCount + 1;
        };
        
        rooms.put(roomId, updatedRoom);
        true
      };
      case null false;
    }
  };

  public func leaveRoom(roomId : RoomId, user : Address) : async Bool {
    switch (rooms.get(roomId)) {
      case (?room) {
        if (room.creator == user) { return false }; // Creator can't leave
        
        let filteredMembers = Array.filter<Address>(room.members, func(m) { m != user });
        let updatedRoom = {
          room with
          members = filteredMembers;
          memberCount = room.memberCount - 1;
        };
        
        rooms.put(roomId, updatedRoom);
        true
      };
      case null false;
    }
  };

  public query func getRoomInfo(id : RoomId) : async ?RoomInfo { rooms.get(id) };

  public query func listRooms() : async [RoomInfo] {
    var result : [RoomInfo] = [];
    for ((_, room) in rooms.entries()) {
      if (room.isActive) {
        result := Array.append<RoomInfo>(result, [room]);
      };
    };
    result
  };

  /// Host updates room chrome (cover/profile image, name, games, topic).
  public func updateRoom(
    roomId : RoomId,
    who : Address,
    name : Text,
    description : Text,
    gameTypes : [Text],
    console : Text,
    rules : Text,
    imageUrl : Text,
  ) : async Bool {
    switch (rooms.get(roomId)) {
      case null { false };
      case (?room) {
        if (room.creator != who) { return false };
        if (Text.size(name) == 0) { return false };
        let updated : RoomInfo = {
          room with
          name = name;
          description = description;
          gameTypes = gameTypes;
          console = console;
          rules = rules;
          imageUrl = imageUrl;
        };
        rooms.put(roomId, updated);
        true
      };
    }
  };

  public query func getRoomChallenges(roomId : RoomId) : async [RoomChallengeInfo] {
    var result : [RoomChallengeInfo] = [];
    switch (roomChallenges.get(roomId)) {
      case (?challengeIds) {
        for (chalId in challengeIds.vals()) {
          switch (roomChallengeInfo.get(chalId)) {
            case (?info) result := Array.append<RoomChallengeInfo>(result, [info]);
            case null {};
          };
        };
      };
      case null {};
    };
    result
  };

  public query func getUserRooms(user : Address) : async [RoomInfo] {
    var result : [RoomInfo] = [];
    for ((_, room) in rooms.entries()) {
      for (member in room.members.vals()) {
        if (member == user) {
          result := Array.append<RoomInfo>(result, [room]);
        };
      };
    };
    result
  };
  
  // Query functions for room player statistics
  public query func getRoomPlayerStats(roomId : RoomId, player : Address) : async ?RoomPlayerStats {
    let key = roomId # ":" # player;
    roomPlayerStats.get(key)
  };
  
  public query func getPlayerRoomStats(player : Address) : async [RoomPlayerStats] {
    var result : [RoomPlayerStats] = [];
    switch (playerRoomStats.get(player)) {
      case (?roomIds) {
        for (rm in roomIds.vals()) {
          let key = rm # ":" # player;
          switch (roomPlayerStats.get(key)) {
            case (?stats) result := Array.append<RoomPlayerStats>(result, [stats]);
            case null {};
          };
        };
      };
      case null {};
    };
    result
  };
  
  public query func getRoomLeaderboard() : async [RoomLeaderboardEntry] {
    var result : [RoomLeaderboardEntry] = [];
    for ((_, entry) in roomLeaderboard.entries()) {
      result := Array.append<RoomLeaderboardEntry>(result, [entry]);
    };
    // Sort by totalEarnings descending - return as-is, frontend can sort
    result
  };
  
  public query func getPlayerLeaderboardEntry(player : Address) : async ?RoomLeaderboardEntry {
    roomLeaderboard.get(player)
  };
  
  public query func getPlayerRoomsList(player : Address) : async [RoomId] {
    switch (playerRoomStats.get(player)) {
      case (?rms) rms;
      case null [];
    }
  };

  // Room Challenge Functions
  public func createRoomChallenge(
    creator : Address,
    roomId : RoomId,
    gameType : Text,
    console : Text,
    maxPlayers : Nat,
    entryFee : Nat,
    rules : Text
  ) : async Text {
    // Verify room exists and creator is a member
    switch (rooms.get(roomId)) {
      case (?room) {
        var isMember = false;
        for (member in room.members.vals()) {
          if (member == creator) { isMember := true };
        };
        
        if (not isMember) { return "Error: Not a room member" };
        if (maxPlayers < 2 or maxPlayers > 8) { return "Error: Max players must be 2-8" };
        
        let id : ChallengeId = "rchal-" # Nat.toText(Int.abs(Time.now()));
        let now = Nat64.fromNat(Int.abs(Time.now()));
        
        let chalInfo : RoomChallengeInfo = {
          id = id;
          roomId = roomId;
          creator = creator;
          roomCreator = room.creator;
          gameType = gameType;
          console = console;
          maxPlayers = maxPlayers;
          entryFee = entryFee;
          payToken = "WICP";
          rules = rules;
          participants = [creator];
          participantCount = 1;
          status = 1;
          startedAt = 0;
          completedAt = 0;
          winner = "";
          prizePool = 0;
          createdAt = now;
          payoutTxId = "";
          payoutAmount = 0;
          platformFeeAmount = 0;
          roomHostFeeAmount = 0;
          treasuryAmount = 0;
          payoutTimestamp = 0;
        };
        
        roomChallengeInfo.put(id, chalInfo);
        
        let existingChals = switch (roomChallenges.get(roomId)) {
          case (?chals) chals;
          case null [];
        };
        roomChallenges.put(roomId, Array.append<ChallengeId>(existingChals, [id]));
        
        id
      };
      case null { return "Error: Room not found" };
    }
  };

  public func joinRoomChallenge(user : Address, challengeId : ChallengeId) : async Bool {
    switch (roomChallengeInfo.get(challengeId)) {
      case (?chal) {
        if (chal.status != 1) { return false };
        
        for (p in chal.participants.vals()) {
          if (p == user) { return false };
        };
        
        switch (rooms.get(chal.roomId)) {
          case (?room) {
            var isMember = false;
            for (member in room.members.vals()) {
              if (member == user) { isMember := true };
            };
            if (not isMember) { return false };
          };
          case null { return false };
        };
        
        let updatedParticipants = Array.append<Address>(chal.participants, [user]);
        let updatedChal = {
          chal with
          participants = updatedParticipants;
          participantCount = chal.participantCount + 1;
          prizePool = chal.prizePool + chal.entryFee;
        };
        
        roomChallengeInfo.put(challengeId, updatedChal);
        true
      };
      case null false;
    }
  };

  public func startRoomChallenge(creator : Address, challengeId : ChallengeId) : async Bool {
    switch (roomChallengeInfo.get(challengeId)) {
      case (?chal) {
        if (chal.creator != creator) { return false };
        if (chal.participantCount < 2) { return false };
        if (chal.status != 1) { return false };
        
        let now = Nat64.fromNat(Int.abs(Time.now()));
        let updatedChal = {
          chal with
          status = 2;
          startedAt = now;
        };
        
        roomChallengeInfo.put(challengeId, updatedChal);
        true
      };
      case null false;
    }
  };

  public func recordRoomChallengeWinner(
    reporter : Address,
    challengeId : ChallengeId,
    winner : Address
  ) : async Bool {
    switch (roomChallengeInfo.get(challengeId)) {
      case (?chal) {
        if (chal.creator != reporter) {
          switch (rooms.get(chal.roomId)) {
            case (?room) {
              if (room.creator != reporter) { return false };
            };
            case null { return false };
          };
        };
        
        if (chal.status != 2) { return false };
        
        var isParticipant = false;
        for (p in chal.participants.vals()) {
          if (p == winner) { isParticipant := true };
        };
        if (not isParticipant) { return false };
        
        // Calculate fee distribution
        let platformFeeBps = 400;
        let roomHostFeeBps = 200;
        let treasuryFeeBps = 100;
        
        let platformFee = chal.prizePool * platformFeeBps / 10000;
        let roomHostFee = chal.prizePool * roomHostFeeBps / 10000;
        let treasuryFee = chal.prizePool * treasuryFeeBps / 10000;
        let winnerPayout = chal.prizePool - platformFee - roomHostFee - treasuryFee;
        
        let txId = "payout-" # Nat.toText(Int.abs(Time.now()));
        let now = Nat64.fromNat(Int.abs(Time.now()));
        
        // Record treasury entries for transparency
        ignore recordTreasuryTransaction(
          #PlatformFee,
          "WICP",
          platformFee,
          ?"challenge_escrow",
          ?"platform",
          ?challengeId,
          null,
          "Platform fee (4%)"
        );
        
        ignore recordTreasuryTransaction(
          #PlatformFee,
          "WICP",
          roomHostFee,
          ?"challenge_escrow",
          ?chal.roomCreator,
          ?challengeId,
          null,
          "Room host fee (2%)"
        );
        
        ignore recordTreasuryTransaction(
          #TreasuryAllocation,
          "WICP",
          treasuryFee,
          ?"challenge_escrow",
          ?"treasury",
          ?challengeId,
          null,
          "Treasury fee (1%)"
        );
        
        ignore recordTreasuryTransaction(
          #PrizeDistribution,
          "WICP",
          winnerPayout,
          ?"challenge_escrow",
          ?winner,
          ?challengeId,
          null,
          "Winner payout (93%)"
        );
        
        let updatedChal = {
          chal with
          status = 3;
          winner = winner;
          completedAt = now;
          payoutTxId = txId;
          payoutAmount = winnerPayout;
          platformFeeAmount = platformFee;
          roomHostFeeAmount = roomHostFee;
          treasuryAmount = treasuryFee;
          payoutTimestamp = now;
        };
        
        roomChallengeInfo.put(challengeId, updatedChal);
        
        // Update player statistics for all participants
        let entryFeePerPlayer = chal.entryFee;
        for (player in chal.participants.vals()) {
          let statsKey = chal.roomId # ":" # player;
          let isWinner = (player == winner);
          let playerEarnings = if (isWinner) { winnerPayout } else { 0 };
          let netEarnings = playerEarnings - entryFeePerPlayer;
          
          let existingStats = switch (roomPlayerStats.get(statsKey)) {
            case (?stats) stats;
            case null {
              {
                roomId = chal.roomId;
                player = player;
                gamesPlayed = 0;
                wins = 0;
                losses = 0;
                totalEarnings = 0;
                totalEntryFees = 0;
                totalPayouts = 0;
                createdAt = now;
                lastPlayed = 0;
              };
            };
          };
          
          let updatedStats = {
            roomId = chal.roomId;
            player = player;
            gamesPlayed = existingStats.gamesPlayed + 1;
            wins = if (isWinner) { existingStats.wins + 1 } else { existingStats.wins };
            losses = if (isWinner) { existingStats.losses } else { existingStats.losses + 1 };
            totalEarnings = existingStats.totalEarnings + netEarnings;
            totalEntryFees = existingStats.totalEntryFees + entryFeePerPlayer;
            totalPayouts = existingStats.totalPayouts + playerEarnings;
            createdAt = existingStats.createdAt;
            lastPlayed = now;
          };
          
          roomPlayerStats.put(statsKey, updatedStats);
          
          // Update player's room list
          let playerRooms = switch (playerRoomStats.get(player)) {
            case (?rms) rms;
            case null [];
          };
          
          var alreadyInList = false;
          for (rm in playerRooms.vals()) {
            if (rm == chal.roomId) { alreadyInList := true };
          };
          
          if (not alreadyInList) {
            playerRoomStats.put(player, Array.append<RoomId>(playerRooms, [chal.roomId]));
          };
        };
        
        // Update global leaderboard
        let now2 = now;
        for (player in chal.participants.vals()) {
          let playerRooms = switch (playerRoomStats.get(player)) {
            case (?rms) rms;
            case null [];
          };
          
          // Calculate totals across all rooms
          var totalGames : Nat = 0;
          var totalWins : Nat = 0;
          var totalLosses : Nat = 0;
          var totalEarnings : Nat = 0;
          
          for (rm in playerRooms.vals()) {
            let key = rm # ":" # player;
            switch (roomPlayerStats.get(key)) {
              case (?stats) {
                totalGames += stats.gamesPlayed;
                totalWins += stats.wins;
                totalLosses += stats.losses;
                totalEarnings += stats.totalEarnings;
              };
              case null {};
            };
          };
          
          let winRate = if (totalGames > 0) { totalWins * 100 / totalGames } else { 0 };
          
          let leaderboardEntry : RoomLeaderboardEntry = {
            player = player;
            totalRooms = playerRooms.size();
            totalGamesPlayed = totalGames;
            totalWins = totalWins;
            totalLosses = totalLosses;
            totalEarnings = totalEarnings;
            winRate = winRate;
            lastActive = now2;
          };
          
          roomLeaderboard.put(player, leaderboardEntry);
        };
        
        true
      };
      case null false;
    }
  };

  public func recreateRoomChallenge(creator : Address, challengeId : ChallengeId) : async { #Ok : ChallengeId; #Err : Text } {
    switch (roomChallengeInfo.get(challengeId)) {
      case (?chal) {
        var canRecreate = (chal.creator == creator);
        
        if (not canRecreate) {
          switch (rooms.get(chal.roomId)) {
            case (?room) {
              for (member in room.members.vals()) {
                if (member == creator) { canRecreate := true };
              };
            };
            case null {};
          };
        };
        
        if (not canRecreate) { return #Err("Error: Not authorized") };
        if (chal.status != 3) { return #Err("Error: Challenge not completed") };
        
        let result = await createRoomChallenge(
          creator,
          chal.roomId,
          chal.gameType,
          chal.console,
          chal.maxPlayers,
          chal.entryFee,
          chal.rules
        );
        
        // Check if result is an error message or a valid ChallengeId
        if (Text.startsWith(result, #text("Error:"))) {
          #Err(result)
        } else {
          #Ok(result)
        }
      };
      case null { return #Err("Error: Challenge not found") };
    }
  };

  // Team functionality implementation
  func teamSplitsTotal(splits : [TeamMemberSplit]) : Nat {
    var s : Nat = 0;
    for (x in splits.vals()) { s += x.winSplitBps };
    s
  };

  func getTeamSplits(teamId : TeamId) : [TeamMemberSplit] {
    switch (teamWinSplits.get(teamId)) {
      case (?xs) xs;
      case null [];
    }
  };

  public func createTeam(creator : Address, name : Text, avatar : Text, description : Text, gameSpecialties : [Text]) : async ?TeamId {
    // Check if player is already in a team
    switch (playerTeams.get(creator)) {
      case (?_) { return null }; // Already in a team
      case null {};
    };
    
    let teamId : TeamId = "team-" # Nat.toText(Int.abs(Time.now()));
    let now = Nat64.fromNat(Int.abs(Time.now()));
    
    let teamInfo : TeamInfo = {
      id = teamId;
      name = name;
      captain = creator;
      members = [creator];
      createdAt = now;
      avatar = avatar;
      description = description;
      gameSpecialties = gameSpecialties;
      tournamentWins = 0;
      tournamentLosses = 0;
      totalEarnings = 0;
      isActive = true;
    };
    
    teams.put(teamId, teamInfo);
    teamMembers.put(teamId, [creator]);
    // Captain starts with 100% of team prize until invites reallocate splits
    teamWinSplits.put(teamId, [{ member = creator; winSplitBps = 10000 }]);
    playerTeams.put(creator, teamId);
    teamTournaments.put(teamId, []);
    
    ?teamId
  };

  public func inviteToTeam(teamId : TeamId, inviter : Address, invitee : Address) : async Bool {
    await inviteToTeamEx(teamId, inviter, invitee, 0)
  };

  /// Invite with win-split % in basis points (e.g. 2500 = 25% of team prize).
  /// On accept, captain's share is reduced by this amount (must leave captain ≥ 0).
  public func inviteToTeamEx(teamId : TeamId, inviter : Address, invitee : Address, winSplitBps : Nat) : async Bool {
    // Verify inviter is team captain
    switch (teams.get(teamId)) {
      case null { return false };
      case (?team) {
        if (team.captain != inviter) { return false }; // Only captain can invite
        if (not team.isActive) { return false }; // Team must be active
      };
    };

    if (winSplitBps > 10000) { return false };
    
    // Check if invitee is already in a team
    switch (playerTeams.get(invitee)) {
      case (?_) { return false }; // Already in a team
      case null {};
    };

    // Captain must have enough unallocated share to offer
    let splits = getTeamSplits(teamId);
    var captainBps : Nat = 0;
    for (s in splits.vals()) {
      if (s.member == inviter) { captainBps := s.winSplitBps };
    };
    if (winSplitBps > 0 and winSplitBps > captainBps) { return false };
    
    let now = Nat64.fromNat(Int.abs(Time.now()));
    let invitation : TeamInvitation = {
      teamId = teamId;
      inviter = inviter;
      invitee = invitee;
      status = #Pending;
      createdAt = now;
      expiresAt = now + 86400 * 7; // 7 days expiration
      winSplitBps = winSplitBps;
    };
    
    // Add invitation to invitee's list
    switch (teamInvitations.get(invitee)) {
      case null { teamInvitations.put(invitee, [invitation]) };
      case (?invitations) { teamInvitations.put(invitee, Array.append(invitations, [invitation])) }
    };
    
    true
  };

  public func respondToTeamInvitation(invitee : Address, teamId : TeamId, accept : Bool) : async Bool {
    switch (teamInvitations.get(invitee)) {
      case null { return false };
      case (?invitations) {
        var found = false;
        var updatedInvitations : [TeamInvitation] = [];
        
        for (invitation in invitations.vals()) {
          if (invitation.teamId == teamId and invitation.invitee == invitee and invitation.status == #Pending) {
            found := true;
            let now = Nat64.fromNat(Int.abs(Time.now()));
            
            if (now > invitation.expiresAt) {
              // Invitation expired
              updatedInvitations := Array.append(updatedInvitations, [{ invitation with status = #Expired }]);
            } else if (accept) {
              // Accept invitation
              updatedInvitations := Array.append(updatedInvitations, [{ invitation with status = #Accepted }]);
              
              // Add player to team + allocate win split from captain
              switch (teams.get(teamId)) {
                case (?team) {
                  let updatedMembers = Array.append(team.members, [invitee]);
                  teams.put(teamId, { team with members = updatedMembers });
                  teamMembers.put(teamId, updatedMembers);
                  playerTeams.put(invitee, teamId);

                  let bps = invitation.winSplitBps;
                  var newSplits : [TeamMemberSplit] = [];
                  let existing = getTeamSplits(teamId);
                  if (Array.size(existing) == 0) {
                    // Fallback: captain remainder + invitee
                    let cap = if (bps >= 10000) { 0 } else { 10000 - bps };
                    newSplits := [
                      { member = team.captain; winSplitBps = cap },
                      { member = invitee; winSplitBps = bps },
                    ];
                  } else {
                    for (s in existing.vals()) {
                      if (s.member == team.captain) {
                        let nextCap = if (s.winSplitBps >= bps) { s.winSplitBps - bps } else { 0 };
                        newSplits := Array.append(newSplits, [{ member = s.member; winSplitBps = nextCap }]);
                      } else {
                        newSplits := Array.append(newSplits, [s]);
                      };
                    };
                    if (bps > 0) {
                      newSplits := Array.append(newSplits, [{ member = invitee; winSplitBps = bps }]);
                    } else {
                      newSplits := Array.append(newSplits, [{ member = invitee; winSplitBps = 0 }]);
                    };
                  };
                  teamWinSplits.put(teamId, newSplits);
                };
                case null {};
              };
            } else {
              // Reject invitation
              updatedInvitations := Array.append(updatedInvitations, [{ invitation with status = #Rejected }]);
            };
          } else {
            updatedInvitations := Array.append(updatedInvitations, [invitation]);
          };
        };
        
        if (found) {
          teamInvitations.put(invitee, updatedInvitations);
          true
        } else {
          false
        }
      }
    }
  };

  /// Captain sets/adjusts member win-split bps. Total must remain ≤ 10000; remainder stays on captain.
  public func setTeamWinSplits(teamId : TeamId, captain : Address, splits : [(Address, Nat)]) : async Bool {
    switch (teams.get(teamId)) {
      case null { false };
      case (?team) {
        if (team.captain != captain) { return false };
        var total : Nat = 0;
        var out : [TeamMemberSplit] = [];
        for ((m, bps) in splits.vals()) {
          // member must be on roster
          var onRoster = false;
          for (x in team.members.vals()) {
            if (x == m) { onRoster := true };
          };
          if (not onRoster) { return false };
          if (bps > 10000) { return false };
          total += bps;
          out := Array.append(out, [{ member = m; winSplitBps = bps }]);
        };
        if (total != 10000) { return false };
        teamWinSplits.put(teamId, out);
        true
      };
    }
  };

  public query func getTeamWinSplits(teamId : TeamId) : async [TeamMemberSplit] {
    getTeamSplits(teamId)
  };

  public func removeFromTeam(teamId : TeamId, captain : Address, member : Address) : async Bool {
    switch (teams.get(teamId)) {
      case null { return false };
      case (?team) {
        if (team.captain != captain) { return false }; // Only captain can remove
        if (member == captain) { return false }; // Cannot remove captain
        
        // Remove member from team
        var updatedMembers : [Address] = [];
        for (m in team.members.vals()) {
          if (m != member) {
            updatedMembers := Array.append(updatedMembers, [m]);
          };
        };

        // Reclaim removed member's split onto captain
        var reclaimed : Nat = 0;
        var captainBps : Nat = 0;
        var others : [TeamMemberSplit] = [];
        for (s in getTeamSplits(teamId).vals()) {
          if (s.member == member) {
            reclaimed += s.winSplitBps;
          } else if (s.member == captain) {
            captainBps := s.winSplitBps;
          } else {
            others := Array.append(others, [s]);
          };
        };
        let captainLine : TeamMemberSplit = {
          member = captain;
          winSplitBps = captainBps + reclaimed;
        };
        teamWinSplits.put(teamId, Array.append([captainLine], others));
        
        teams.put(teamId, { team with members = updatedMembers });
        teamMembers.put(teamId, updatedMembers);
        ignore playerTeams.remove(member);
        
        true
      }
    }
  };

  public func disbandTeam(teamId : TeamId, captain : Address) : async Bool {
    switch (teams.get(teamId)) {
      case null { return false };
      case (?team) {
        if (team.captain != captain) { return false }; // Only captain can disband
        
        // Remove all members from team tracking
        for (member in team.members.vals()) {
          ignore playerTeams.remove(member);
        };
        
        // Mark team as inactive
        teams.put(teamId, { team with isActive = false });
        
        true
      }
    }
  };

  public func updateTeamStats(teamId : TeamId, isWin : Bool, earnings : Nat) : async () {
    switch (teams.get(teamId)) {
      case (?team) {
        let updatedWins = if (isWin) { team.tournamentWins + 1 } else { team.tournamentWins };
        let updatedLosses = if (not isWin) { team.tournamentLosses + 1 } else { team.tournamentLosses };
        let updatedEarnings = team.totalEarnings + earnings;
        
        teams.put(teamId, { 
          team with 
          tournamentWins = updatedWins;
          tournamentLosses = updatedLosses;
          totalEarnings = updatedEarnings;
        });
      };
      case null {};
    }
  };

  // Team query functions
  public query func getTeamInfo(teamId : TeamId) : async ?TeamInfo { teams.get(teamId) };
  public query func getTeamMembers(teamId : TeamId) : async [Address] { switch (teamMembers.get(teamId)) { case (?members) members; case null [] } };
  public query func getPlayerTeam(player : Address) : async ?TeamId { playerTeams.get(player) };
  public query func getTeamInvitations(player : Address) : async [TeamInvitation] { switch (teamInvitations.get(player)) { case (?invitations) invitations; case null [] } };
  public query func getTeamTournaments(teamId : TeamId) : async [TournamentId] { switch (teamTournaments.get(teamId)) { case (?tournaments) tournaments; case null [] } };
  public query func listTeams() : async [(TeamId, TeamInfo)] { Iter.toArray(teams.entries()) };

  public func disputeChallenge(id : ChallengeId, _reason : Text) : async Bool {
    switch (challenges.get(id)) {
      case null { false };
      case (?c) { challenges.put(id, { c with status = 5 }); true }
    }
  };

  public func cancelChallenge(id : ChallengeId, _reason : Text) : async Bool {
    switch (challenges.get(id)) {
      case null { false };
      case (?c) { challenges.put(id, { c with status = 0 }); true }
    }
  };

  /// Step 1: player requests mutual cancel (standalone only — tournament == "")
  public func requestMutualCancel(id : ChallengeId, who : Address, _serviceFee : Nat) : async Bool {
    switch (challenges.get(id)) {
      case null { false };
      case (?c) {
        if (c.tournament != "") { return false };
        if (c.status != 1 and c.status != 2 and c.status != 3) { return false };
        if (who != c.creator and who != c.opponent) { return false };
        if (c.cancelRequester != "") { return false };
        let now = Nat64.fromNat(Int.abs(Time.now()));
        challenges.put(id, {
          c with
          cancelRequester = who;
          cancelRequestedAt = now;
        });
        true
      }
    }
  };

  public func withdrawMutualCancel(id : ChallengeId, who : Address) : async Bool {
    switch (challenges.get(id)) {
      case null { false };
      case (?c) {
        if (c.cancelRequester != who) { return false };
        challenges.put(id, {
          c with
          cancelRequester = ("" : Address);
          cancelRequestedAt = (0 : Nat64);
        });
        true
      }
    }
  };

  /// Step 2: other player accepts → status 6 cancelled
  public func acceptMutualCancel(id : ChallengeId, who : Address) : async Bool {
    switch (challenges.get(id)) {
      case null { false };
      case (?c) {
        if (c.cancelRequester == "") { return false };
        if (who == c.cancelRequester) { return false };
        if (who != c.creator and who != c.opponent) { return false };
        if (c.tournament != "") { return false };
        ignore recordTreasuryTransaction(
          #Withdrawal,
          c.payToken,
          c.contractBalance,
          ?"treasury",
          ?who,
          ?id,
          null,
          "Mutual cancellation refund for challenge " # id
        );
        challenges.put(id, {
          c with
          status = 6;
          cancelRequester = ("" : Address);
          cancelRequestedAt = (0 : Nat64);
        });
        true
      }
    }
  };

  /// Non-requester disputes cancel when either score > 0 — video proof required
  public func disputeMutualCancel(id : ChallengeId, who : Address, videoProof : Text, reason : Text) : async Bool {
    switch (challenges.get(id)) {
      case null { false };
      case (?c) {
        if (c.cancelRequester == "") { return false };
        if (who == c.cancelRequester) { return false };
        if (who != c.creator and who != c.opponent) { return false };
        if (c.player1score == 0 and c.player2score == 0) { return false };
        if (videoProof == "") { return false };
        challenges.put(id, {
          c with
          status = 5;
          disputeBy = who;
          disputeVideo = videoProof;
          disputeReason = reason;
          cancelRequester = ("" : Address);
          cancelRequestedAt = (0 : Nat64);
        });
        true
      }
    }
  };

  // Dispute resolution system
  public func createDispute(challengeId : ChallengeId, disputedBy : Address, reason : Text) : async ?Dispute {
    // Check if challenge exists and is in appropriate state
    switch (challenges.get(challengeId)) {
      case null { return null };
      case (?challenge) {
        if (challenge.status != 3 and challenge.status != 4) { return null }; // Must be scored or confirmed
        
        // Check if dispute already exists
        switch (disputes.get(challengeId)) {
          case (?_) { return null }; // Dispute already exists
          case null {};
        };
        
        let now = Nat64.fromNat(Int.abs(Time.now()));
        let expiresAt = now + 86400 * 3; // 3 days to resolve
        
        let dispute : Dispute = {
          challengeId = challengeId;
          disputedBy = disputedBy;
          disputedAt = now;
          status = #Active;
          votes = [];
          expiresAt = expiresAt;
        };
        
        disputes.put(challengeId, dispute);
        ?dispute
      }
    }
  };

  public func voteOnDispute(challengeId : ChallengeId, moderator : Address, winner : Address, weight : Nat) : async Bool {
    // Check if moderator exists and has appropriate role
    switch (moderators.get(moderator)) {
      case (?mod) {
        switch (mod.role) {
          case (#BaseReferee) {};
          case (#VettedMod) {};
          case (#SuperMod) {};
          case (#AdminMod) {};
        }
      };
      case null return false;
    };
    
    // Check if dispute exists and is active
    switch (disputes.get(challengeId)) {
      case (?dispute) {
        if (dispute.status != #Active) { return false };
        
        let now = Nat64.fromNat(Int.abs(Time.now()));
        if (now > dispute.expiresAt) { return false }; // Dispute expired
        
        // Check if moderator already voted
        for (vote in dispute.votes.vals()) {
          if (vote.moderator == moderator) { return false }; // Already voted
        };
        
        // Add vote
        let newVote : Vote = {
          moderator = moderator;
          winner = winner;
          weight = weight;
        };
        
        let updatedVotes = Array.append<Vote>(dispute.votes, [newVote]);
        let updatedDispute = { dispute with votes = updatedVotes };
        disputes.put(challengeId, updatedDispute);
        
        // Update moderator stats
        switch (moderators.get(moderator)) {
          case (?mod) {
            let updatedMod = { mod with disputesResolved = mod.disputesResolved + 1 };
            moderators.put(moderator, updatedMod);
          };
          case null {};
        };
        
        true
      };
      case null false;
    }
  };

  public func finalizeDispute(challengeId : ChallengeId, finalizer : Address) : async Bool {
    // Check if finalizer is SuperMod or AdminMod
    switch (moderators.get(finalizer)) {
      case (?mod) {
        switch (mod.role) {
          case (#SuperMod) {};
          case (#AdminMod) {};
          case _ return false;
        }
      };
      case null return false;
    };
    
    switch (disputes.get(challengeId)) {
      case (?dispute) {
        if (dispute.status != #Active) { return false };
        
        // Count votes
        var voteCount = HashMap.HashMap<Address, Nat>(16, Text.equal, Text.hash);
        for (vote in dispute.votes.vals()) {
          let current = switch (voteCount.get(vote.winner)) { case (?c) c; case null 0 };
          voteCount.put(vote.winner, current + vote.weight);
        };
        
        // Find winner (address with most votes)
        var winningAddress = "";
        var maxVotes = 0;
        for ((addr, votes) in voteCount.entries()) {
          if (votes > maxVotes) {
            winningAddress := addr;
            maxVotes := votes;
          };
        };
        
        if (winningAddress == "") { return false }; // No votes
        
        // Apply penalty to the loser (disputedBy if they lost, otherwise the other player)
        let loser = if (winningAddress == dispute.disputedBy) {
          // disputedBy won, so the other player (opponent) loses
          switch (challenges.get(challengeId)) {
            case (?challenge) {
              if (challenge.creator == dispute.disputedBy) { challenge.opponent } else { challenge.creator }
            };
            case null return false;
          }
        } else {
          // disputedBy lost
          dispute.disputedBy
        };
        
        // Apply 90-day penalty to loser only
        let now = Nat64.fromNat(Int.abs(Time.now()));
        let penaltyUntil = now + (90 * 24 * 3600); // 90 days in seconds
        
        // Update penalty for loser
        switch (penalties.get(loser)) {
          case (?currentPenalty) {
            let newMultiplier = currentPenalty.multiplier * 2; // Double the penalty
            penalties.put(loser, { surchargeUntil = penaltyUntil; multiplier = newMultiplier });
          };
          case null {
            penalties.put(loser, { surchargeUntil = penaltyUntil; multiplier = 2 });
          };
        };
        
        // Update gamer profile with penalty
        switch (gamers.get(loser)) {
          case (?gamer) {
            let updatedGamer = { gamer with penaltyMultiplier = 2 }; // Set penalty multiplier
            gamers.put(loser, updatedGamer);
          };
          case null {
            // Create gamer with penalty if doesn't exist
            let penalizedGamer : Gamer = {
              wallet = loser;
              username = "Anonymous";
              avatarUrl = "";
              baseRake = 800; // 8% default
              totalGamesPlayed = 0;
              totalTournamentsHosted = 0;
              disputeWinRate = 0;
              upvotes = 0;
              penaltyMultiplier = 2; // Penalty multiplier
              wins = 0;
              losses = 0;
              currentWinStreak = 0;
              currentLossStreak = 0;
              longestWinStreak = 0;
              longestLossStreak = 0;
              gameRecords = [];
              // Earnings tracking
              totalHeadsUpEarnings = 0;
              totalHeadsUpLosses = 0;
              totalTournamentEarnings = 0;
              totalTournamentLosses = 0;
              tournamentWins = 0;
              tournamentLosses = 0;
              earningsByToken = [];
            };
            gamers.put(loser, penalizedGamer);
          };
        };
        
        // Mark dispute as resolved
        let updatedDispute = { dispute with status = #Resolved };
        disputes.put(challengeId, updatedDispute);
        
        true
      };
      case null false;
    }
  };

  public query func getDispute(challengeId : ChallengeId) : async ?Dispute { disputes.get(challengeId) };
  public query func listActiveDisputes() : async [Dispute] {
    var activeDisputes : [Dispute] = [];
    for (dispute in disputes.vals()) {
      if (dispute.status == #Active) {
        activeDisputes := Array.append<Dispute>(activeDisputes, [dispute]);
      }
    };
    activeDisputes
  };

  // Web4 HTTP Request Handler (update)
  public func http_request_update(request : {
    method : Text;
    url : Text;
    headers : [(Text, Text)];
    body : [Nat8];
  }) : async {
    status_code : Nat16;
    headers : [(Text, Text)];
    body : [Nat8];
  } {
    // Parse URL path
    let path = request.url;
    
    // Health Check is implemented below with detailed metrics
    
    // Games Registry Endpoint
    if (request.method == "GET" and path == "/games") {
      var gamesList : [(Text, { name : Text; description : Text; category : Text; createdBy : Address; createdAt : Nat64 })] = [];
      for ((gameId, metadata) in gameMetadata.entries()) {
        gamesList := Array.append<(Text, { name : Text; description : Text; category : Text; createdBy : Address; createdAt : Nat64 })>(gamesList, [(gameId, metadata)]);
      };
      let jsonResponse = gameListToJson(gamesList);
      return {
        status_code = 200;
        headers = [("Content-Type", "application/json")];
        body = Blob.toArray(Text.encodeUtf8(jsonResponse));
      }
    };
    
    // Rules Registry Endpoint
    if (request.method == "GET" and Text.contains(path, #text "/rules/")) {
      let gameId = getGameIdFromPath(path);
      let rules = switch (rulesByGame.get(gameId)) {
        case (?xs) xs;
        case null [];
      };
      let jsonResponse = rulesListToJson(rules);
      return {
        status_code = 200;
        headers = [("Content-Type", "application/json")];
        body = Blob.toArray(Text.encodeUtf8(jsonResponse));
      }
    };
    
    // Supported Tokens Endpoint
    if (request.method == "GET" and path == "/tokens") {
      var tokensList : [(Text, TokenInfo)] = [];
      for ((tokenId, info) in supportedTokens.entries()) {
        tokensList := Array.append<(Text, TokenInfo)>(tokensList, [(tokenId, info)]);
      };
      let jsonResponse = tokensListToJson(tokensList);
      return {
        status_code = 200;
        headers = [("Content-Type", "application/json")];
        body = Blob.toArray(Text.encodeUtf8(jsonResponse));
      }
    };
    
    // Treasury Transactions Endpoint
    if (request.method == "GET" and Text.contains(path, #text "/treasury/transactions")) {
      // Parse query parameters for filtering
      let tokenType = getQueryParam(request.url, "token");
      let txType = getQueryParam(request.url, "type");
      let limit = getQueryParamNat(request.url, "limit", 50);
      let offset = getQueryParamNat(request.url, "offset", 0);
      
      // Convert transaction type string to variant
      let transactionType = switch (txType) {
        case (?"deposit") ?#Deposit;
        case (?"withdrawal") ?#Withdrawal;
        case (?"rake") ?#RakeCollection;
        case (?"prize") ?#PrizeDistribution;
        case (?"fee") ?#PlatformFee;
        case (?"allocation") ?#TreasuryAllocation;
        case _ null;
      };
      
      // Get filtered transactions directly
      var result : [TreasuryTransaction] = [];
      let start = offset;
      let max = limit;
      var count = 0;
      var added = 0;
      
      for (tx in treasuryTransactionList.vals()) {
        if (count >= start and added < max) {
          let matchesToken = switch (tokenType) {
            case (?t) tx.tokenType == t;
            case null true;
          };
          let matchesType = switch (transactionType) {
            case (?tt) tx.transactionType == tt;
            case null true;
          };
          
          if (matchesToken and matchesType) {
            result := Array.append<TreasuryTransaction>(result, [tx]);
            added := added + 1;
          };
        };
        count := count + 1;
      };
      let jsonResponse = treasuryTransactionsToJson(result);
      return {
        status_code = 200;
        headers = [("Content-Type", "application/json")];
        body = Blob.toArray(Text.encodeUtf8(jsonResponse));
      }
    };
    
    // Treasury Balance Summary Endpoint
    if (request.method == "GET" and path == "/treasury/balances") {
      var summary : [(Text, Nat)] = [];
      // WICP is now the primary token
      let tokens = ["WICP", "ICP", "ckBTC", "ckETH", "XTC"];
      
      for (token in tokens.vals()) {
        var balance = 0;
        for (tx in treasuryTransactionList.vals()) {
          if (tx.tokenType == token) {
            switch (tx.transactionType) {
              case (#Deposit) balance := balance + tx.amount;
              case (#RakeCollection) balance := balance + tx.amount;
              case (#Withdrawal) balance := balance - tx.amount;
              case (#PrizeDistribution) balance := balance - tx.amount;
              case (#PlatformFee) balance := balance + tx.amount;
              case (#TreasuryAllocation) balance := balance + tx.amount;
            }
          }
        };
        if (balance > 0) {
          summary := Array.append<(Text, Nat)>(summary, [(token, balance)]);
        }
      };
      
      let jsonResponse = treasurySummaryToJson(summary);
      return {
        status_code = 200;
        headers = [("Content-Type", "application/json")];
        body = Blob.toArray(Text.encodeUtf8(jsonResponse));
      }
    };
    
    // Treasury Balance by Token Endpoint
    if (request.method == "GET" and Text.contains(path, #text "/treasury/balance/")) {
      let tokenId = getTokenIdFromPath(path);
      var balance = 0;
      for (tx in treasuryTransactionList.vals()) {
        if (tx.tokenType == tokenId) {
          switch (tx.transactionType) {
            case (#Deposit) balance := balance + tx.amount;
            case (#RakeCollection) balance := balance + tx.amount;
            case (#Withdrawal) balance := balance - tx.amount;
            case (#PrizeDistribution) balance := balance - tx.amount;
            case (#PlatformFee) balance := balance + tx.amount;
            case (#TreasuryAllocation) balance := balance + tx.amount;
          }
        }
      };
      
      let jsonResponse = "{\"token\":\"" # tokenId # "\",\"balance\":" # Nat.toText(balance) # "}";
      return {
        status_code = 200;
        headers = [("Content-Type", "application/json")];
        body = Blob.toArray(Text.encodeUtf8(jsonResponse));
      }
    };
    
    // Treasury Donation Endpoint
    if (request.method == "POST" and path == "/treasury/donate") {
      // Parse JSON body for donation details
      let bodyText = Text.decodeUtf8(Blob.fromArray(request.body));
      switch (bodyText) {
        case (?text) {
          // Simple JSON parsing for donation parameters
          let tokenType = extractJson(text, "tokenType");
          let amountText = extractJson(text, "amount");
          let donor = extractJson(text, "donor");
          let description = extractJson(text, "description");
          let desc = switch (description) { case (?d) d; case null "" };
          
          switch (tokenType, amountText, donor) {
            case (?token, ?amountStr, ?donorAddr) {
              let amount = Nat.fromText(amountStr);
              switch (amount) {
                case (?amt) {
                  let success = await donate(token, amt, donorAddr, desc);
                  if (success) {
                    return {
                      status_code = 200;
                      headers = [("Content-Type", "application/json")];
                      body = Blob.toArray(Text.encodeUtf8("{\"status\":\"success\",\"message\":\"Donation recorded\"}"));
                    }
                  } else {
                    return {
                      status_code = 400;
                      headers = [("Content-Type", "application/json")];
                      body = Blob.toArray(Text.encodeUtf8("{\"error\":\"Invalid donation parameters\"}"));
                    }
                  }
                };
                case null {
                  return {
                    status_code = 400;
                    headers = [("Content-Type", "application/json")];
                    body = Blob.toArray(Text.encodeUtf8("{\"error\":\"Invalid amount\"}"));
                  }
                };
              }
            };
            case _ {
              return {
                status_code = 400;
                headers = [("Content-Type", "application/json")];
                body = Blob.toArray(Text.encodeUtf8("{\"error\":\"Missing required parameters\"}"));
              }
            };
          }
        };
        case null {
          return {
            status_code = 400;
            headers = [("Content-Type", "application/json")];
            body = Blob.toArray(Text.encodeUtf8("{\"error\":\"Invalid request body\"}"));
          }
        };
      }
    };
    
    // Treasury Allocation Limits Endpoint
    if (request.method == "GET" and path == "/treasury/allocation-limits") {
      // WICP is now the primary token for allocations
      let tokens = ["WICP", "ICP", "ckBTC", "ckETH", "XTC"];
      var limits : [{ token : Text; limit : Nat; current : Nat }] = [];
      
      for (token in tokens.vals()) {
        let limit = await getFreeTournamentAllocationLimit(token);
        let current = await getCurrentFreeTournamentAllocation(token);
        limits := Array.append<{ token : Text; limit : Nat; current : Nat }>(limits, [{ token = token; limit = limit; current = current }]);
      };
      
      let jsonResponse = allocationLimitsToJson(limits);
      return {
        status_code = 200;
        headers = [("Content-Type", "application/json")];
        body = Blob.toArray(Text.encodeUtf8(jsonResponse));
      }
    };
    
    // Tournament Bracket Endpoints (Temporarily disabled - need to be called directly)
    // if (request.method == "GET" and Text.contains(path, #text "/tournament/bracket/")) {
    //   let tournamentId = getTournamentIdFromPath(path);
    //   let bracketDetails = getTournamentBracketDetails(tournamentId);
    //   
    //   switch (bracketDetails) {
    //     case (?details) {
    //       let jsonResponse = bracketDetailsToJson(details);
    //       return {
    //         status_code = 200;
    //         headers = [("Content-Type", "application/json")];
    //         body = Blob.toArray(Text.encodeUtf8(jsonResponse));
    //       }
    //     };
    //     case null {
    //       return {
    //         status_code = 404;
    //         headers = [("Content-Type", "application/json")];
    //         body = Blob.toArray(Text.encodeUtf8("{\"error\":\"Tournament not found\"}"));
    //       }
    //     };
    //   }
    // };
    
    // Tournament Bracket State Endpoint (Temporarily disabled - need to be called directly)
    // if (request.method == "GET" and Text.contains(path, #text "/tournament/state/")) {
    //   let tournamentId = getTournamentIdFromPath(path);
    //   let bracketState = getTournamentBracketState(tournamentId);
    //   
    //   let jsonResponse = tournamentBracketStateToJson(bracketState);
    //   return {
    //     status_code = 200;
    //     headers = [("Content-Type", "application/json")];
    //     body = Blob.toArray(Text.encodeUtf8(jsonResponse));
    //   }
    // };

    // Enhanced Health Check with detailed metrics
    if (request.method == "GET" and path == "/health") {
      let healthStatus = await getHealthStatus();
      let systemMetrics = await getSystemMetrics();
      let performanceMetrics = await getPerformanceMetrics();
      
      var json = "{";
      let statusText = switch (healthStatus.status) {
        case (#Healthy) "healthy";
        case (#Degraded) "degraded";
        case (#Unhealthy) "unhealthy";
        case (#Critical) "critical";
      };
      json #= "\"status\": \"" # statusText # "\",";
      json #= "\"overallScore\": " # Nat.toText(healthStatus.overallScore) # ",";
      
      // System metrics
      json #= "\"systemMetrics\": {";
      json #= "\"totalChallenges\": " # Nat.toText(systemMetrics.totalChallenges) # ",";
      json #= "\"activeChallenges\": " # Nat.toText(systemMetrics.activeChallenges) # ",";
      json #= "\"completedChallenges\": " # Nat.toText(systemMetrics.completedChallenges) # ",";
      json #= "\"disputedChallenges\": " # Nat.toText(systemMetrics.disputedChallenges) # ",";
      json #= "\"totalTournaments\": " # Nat.toText(systemMetrics.totalTournaments) # ",";
      json #= "\"activeTournaments\": " # Nat.toText(systemMetrics.activeTournaments) # ",";
      json #= "\"completedTournaments\": " # Nat.toText(systemMetrics.completedTournaments) # ",";
      json #= "\"totalParticipants\": " # Nat.toText(systemMetrics.totalParticipants) # ",";
      json #= "\"totalPrizePool\": " # Nat.toText(systemMetrics.totalPrizePool) # ",";
      json #= "\"totalRakeCollected\": " # Nat.toText(systemMetrics.totalRakeCollected) # ",";
      json #= "\"systemUptime\": " # Nat64.toText(systemMetrics.systemUptime) # ",";
      json #= "\"lastHealthCheck\": " # Nat64.toText(systemMetrics.lastHealthCheck);
      json #= "},";
      
      // Performance metrics
      json #= "\"performanceMetrics\": {";
      json #= "\"averageChallengeCompletionTime\": " # Nat64.toText(performanceMetrics.averageChallengeCompletionTime) # ",";
      json #= "\"averageTournamentCompletionTime\": " # Nat64.toText(performanceMetrics.averageTournamentCompletionTime) # ",";
      json #= "\"challengeDisputeRate\": " # Float.toText(performanceMetrics.challengeDisputeRate) # ",";
      json #= "\"tournamentCompletionRate\": " # Float.toText(performanceMetrics.tournamentCompletionRate) # ",";
      json #= "\"activeUsers\": " # Nat.toText(performanceMetrics.activeUsers) # ",";
      json #= "\"dailyActiveUsers\": " # Nat.toText(performanceMetrics.dailyActiveUsers) # ",";
      json #= "\"weeklyActiveUsers\": " # Nat.toText(performanceMetrics.weeklyActiveUsers) # ",";
      json #= "\"monthlyActiveUsers\": " # Nat.toText(performanceMetrics.monthlyActiveUsers);
      json #= "},";
      
      // Components
      json #= "\"components\": [";
      var first = true;
      for (component in healthStatus.components.vals()) {
        if (not first) { json #= "," };
        json #= "{";
        json #= "\"name\": \"" # component.name # "\",";
        let componentStatusText = switch (component.status) {
          case (#Healthy) "healthy";
          case (#Degraded) "degraded";
          case (#Unhealthy) "unhealthy";
          case (#Critical) "critical";
        };
        json #= "\"status\": \"" # componentStatusText # "\",";
        json #= "\"message\": \"" # component.message # "\",";
        json #= "\"lastCheck\": " # Nat64.toText(component.lastCheck);
        json #= "}";
        first := false;
      };
      json #= "],";
      
      // Recommendations
      json #= "\"recommendations\": [";
      first := true;
      for (rec in healthStatus.recommendations.vals()) {
        if (not first) { json #= "," };
        json #= "\"" # rec # "\"";
        first := false;
      };
      json #= "]";
      
      json := json # "}";
      
      return {
        status_code = 200;
        headers = [("Content-Type", "application/json")];
        body = Blob.toArray(Text.encodeUtf8(json));
      }
    };

    // WICP debit endpoints (approve + pull model)
    if (request.method == "POST" and Text.contains(path, #text "/challenge/wicp/debit")) {
      let bodyText = Text.decodeUtf8(Blob.fromArray(request.body));
      switch (bodyText) {
        case (?text) {
          let challengeId = extractJson(text, "challengeId");
          let fromText = extractJson(text, "from");
          let amountText = extractJson(text, "amount");
          switch (challengeId, fromText, amountText) {
            case (?cid, ?fromAddr, ?amtStr) {
              switch (Nat.fromText(amtStr)) {
                case (?amt) {
                  let ok = await debitChallengeWICP(cid, Principal.fromText(fromAddr), amt);
                  let body = if (ok) { "{\"ok\":true}" } else { "{\"ok\":false}" };
                  return { status_code = 200; headers = [("Content-Type","application/json")]; body = Blob.toArray(Text.encodeUtf8(body)) };
                };
                case null {
                  return { status_code = 400; headers = [("Content-Type","application/json")]; body = Blob.toArray(Text.encodeUtf8("{\"error\":\"invalid amount\"}")) };
                };
              };
            };
            case _ { return { status_code = 400; headers = [("Content-Type","application/json")]; body = Blob.toArray(Text.encodeUtf8("{\"error\":\"missing parameters\"}")) } };
          };
        };
        case null { return { status_code = 400; headers = [("Content-Type","application/json")]; body = Blob.toArray(Text.encodeUtf8("{\"error\":\"invalid body\"}")) } };
      };
    };

    if (request.method == "POST" and Text.contains(path, #text "/challenge/wicp/debit-opponent")) {
      let bodyText = Text.decodeUtf8(Blob.fromArray(request.body));
      switch (bodyText) {
        case (?text) {
          let challengeId = extractJson(text, "challengeId");
          let fromText = extractJson(text, "from");
          let amountText = extractJson(text, "amount");
          switch (challengeId, fromText, amountText) {
            case (?cid, ?fromAddr, ?amtStr) {
              switch (Nat.fromText(amtStr)) {
                case (?amt) {
                  let ok = await debitChallengeOpponentWICP(cid, Principal.fromText(fromAddr), amt);
                  let body = if (ok) { "{\"ok\":true}" } else { "{\"ok\":false}" };
                  return { status_code = 200; headers = [("Content-Type","application/json")]; body = Blob.toArray(Text.encodeUtf8(body)) };
                };
                case null {
                  return { status_code = 400; headers = [("Content-Type","application/json")]; body = Blob.toArray(Text.encodeUtf8("{\"error\":\"invalid amount\"}")) };
                };
              };
            };
            case _ { return { status_code = 400; headers = [("Content-Type","application/json")]; body = Blob.toArray(Text.encodeUtf8("{\"error\":\"missing parameters\"}")) } };
          };
        };
        case null { return { status_code = 400; headers = [("Content-Type","application/json")]; body = Blob.toArray(Text.encodeUtf8("{\"error\":\"invalid body\"}")) } };
      };
    };

    if (request.method == "POST" and Text.contains(path, #text "/tournament/wicp/debit")) {
      let bodyText = Text.decodeUtf8(Blob.fromArray(request.body));
      switch (bodyText) {
        case (?text) {
          let tournamentId = extractJson(text, "tournamentId");
          let fromText = extractJson(text, "from");
          let amountText = extractJson(text, "amount");
          switch (tournamentId, fromText, amountText) {
            case (?tid, ?fromAddr, ?amtStr) {
              switch (Nat.fromText(amtStr)) {
                case (?amt) {
                  let ok = await debitTournamentWICP(tid, Principal.fromText(fromAddr), amt);
                  let body = if (ok) { "{\"ok\":true}" } else { "{\"ok\":false}" };
                  return { status_code = 200; headers = [("Content-Type","application/json")]; body = Blob.toArray(Text.encodeUtf8(body)) };
                };
                case null {
                  return { status_code = 400; headers = [("Content-Type","application/json")]; body = Blob.toArray(Text.encodeUtf8("{\"error\":\"invalid amount\"}")) };
                };
              };
            };
            case _ { return { status_code = 400; headers = [("Content-Type","application/json")]; body = Blob.toArray(Text.encodeUtf8("{\"error\":\"missing parameters\"}")) } };
          };
        };
        case null { return { status_code = 400; headers = [("Content-Type","application/json")]; body = Blob.toArray(Text.encodeUtf8("{\"error\":\"invalid body\"}")) } };
      };
    };

    if (request.method == "POST" and Text.contains(path, #text "/donate/wicp/debit")) {
      let bodyText = Text.decodeUtf8(Blob.fromArray(request.body));
      switch (bodyText) {
        case (?text) {
          let fromText = extractJson(text, "from");
          let amountText = extractJson(text, "amount");
          let memo = extractJson(text, "memo");
          switch (fromText, amountText) {
            case (?fromAddr, ?amtStr) {
              switch (Nat.fromText(amtStr)) {
                case (?amt) {
                  let ok = await debitDonationWICP(Principal.fromText(fromAddr), amt, switch (memo) { case (?m) m; case null "" });
                  let body = if (ok) { "{\"ok\":true}" } else { "{\"ok\":false}" };
                  return { status_code = 200; headers = [("Content-Type","application/json")]; body = Blob.toArray(Text.encodeUtf8(body)) };
                };
                case null {
                  return { status_code = 400; headers = [("Content-Type","application/json")]; body = Blob.toArray(Text.encodeUtf8("{\"error\":\"invalid amount\"}")) };
                };
              };
            };
            case _ { return { status_code = 400; headers = [("Content-Type","application/json")]; body = Blob.toArray(Text.encodeUtf8("{\"error\":\"missing parameters\"}")) } };
          };
        };
        case null { return { status_code = 400; headers = [("Content-Type","application/json")]; body = Blob.toArray(Text.encodeUtf8("{\"error\":\"invalid body\"}")) } };
      };
    };
    // System Alerts Endpoint
    if (request.method == "GET" and path == "/alerts") {
      let resolved = getQueryParamText(request.url, "resolved", null);
      let resolvedFilter = switch (resolved) {
        case (?"true") ?true;
        case (?"false") ?false;
        case (_) null;
      };
      
      let alerts = await getSystemAlerts(resolvedFilter);
      
      var json = "{";
      json #= "\"alerts\": [";
      
      var first = true;
      for (alert in alerts.vals()) {
        if (not first) { json #= "," };
        json #= "{";
        json #= "\"id\": \"" # alert.id # "\",";
        let alertTypeText = switch (alert.kind) {
          case (#HighDisputeRate) "high_dispute_rate";
          case (#LowCompletionRate) "low_completion_rate";
          case (#SystemOverload) "system_overload";
          case (#SecurityBreach) "security_breach";
          case (#PerformanceDegradation) "performance_degradation";
          case (#Custom) "custom";
        };
        json #= "\"type\": \"" # alertTypeText # "\",";
        let severityText = switch (alert.severity) {
          case (#Critical) "critical";
          case (#High) "high";
          case (#Medium) "medium";
          case (#Low) "low";
          case (#Info) "info";
        };
        json #= "\"severity\": \"" # severityText # "\",";
        json #= "\"message\": \"" # alert.message # "\",";
        json #= "\"timestamp\": " # Nat64.toText(alert.timestamp) # ",";
        json #= "\"resolved\": " # (if (alert.resolved) "true" else "false");
        switch (alert.metadata) {
          case (?meta) json #= ", \"metadata\": \"" # meta # "\"";
          case null {};
        };
        json #= "}";
        first := false;
      };
      
      json #= "]}";
      
      return {
        status_code = 200;
        headers = [("Content-Type", "application/json")];
        body = Blob.toArray(Text.encodeUtf8(json));
      }
    };

    // User Activity Endpoint
    if (request.method == "GET" and Text.contains(path, #text "/activity/")) {
      let parts = Text.split(path, #char '/');
      var userAddress = "";
      for (part in parts) {
        if (Text.contains(part, #text "0x") or Text.contains(part, #text "icp:")) {
          userAddress := part;
        };
      };
      
      if (userAddress == "") {
        return {
          status_code = 400;
          headers = [("Content-Type", "application/json")];
          body = Blob.toArray(Text.encodeUtf8("{\"error\": \"User address not found in path\"}"));
        }
      };
      
      let limit = getQueryParamNat(request.url, "limit", 50);
      let activity = await getUserActivity(userAddress, ?limit);
      
      var json = "{";
      json #= "\"user\": \"" # userAddress # "\",";
      json #= "\"activities\": [";
      
      var first = true;
      for (act in activity.vals()) {
        if (not first) { json #= "," };
        json #= "{";
        json #= "\"timestamp\": " # Nat64.toText(act.0) # ",";
        json #= "\"activity\": \"" # act.1 # "\"";
        json #= "}";
        first := false;
      };
      
      json #= "]}";
      
      return {
        status_code = 200;
        headers = [("Content-Type", "application/json")];
        body = Blob.toArray(Text.encodeUtf8(json));
      }
    };
    if (request.method == "GET" and Text.contains(path, #text "/tournament/bracket/seeds/")) {
      let tournamentId = getTournamentIdFromPath(path);
      let seeds = await getTournamentBracketSeeds(tournamentId);
      
      var json = "{";
      json #= "\"tournamentId\": \"" # tournamentId # "\",";
      json #= "\"seeds\": [";
      
      var first = true;
      for (seed in seeds.vals()) {
        if (not first) { json #= "," };
        json #= "{\"player\": \"" # seed.0 # "\", \"seed\": " # Nat.toText(seed.1) # "}";
        first := false;
      };
      
      json #= "]}";
      
      return {
        status_code = 200;
        headers = [("Content-Type", "application/json")];
        body = Blob.toArray(Text.encodeUtf8(json));
      }
    };

    if (request.method == "GET" and Text.contains(path, #text "/tournament/bracket/positions/")) {
      let tournamentId = getTournamentIdFromPath(path);
      let positions = await getTournamentBracketPositions(tournamentId);
      
      var json = "{";
      json #= "\"tournamentId\": \"" # tournamentId # "\",";
      json #= "\"positions\": [";
      
      var first = true;
      for (pos in positions.vals()) {
        if (not first) { json #= "," };
        json #= "{\"player\": \"" # pos.0 # "\", \"challengeId\": ";
        switch (pos.1) {
          case (?cid) json #= "\"" # cid # "\"";
          case null json #= "null";
        };
        json #= ", \"winner\": ";
        switch (pos.2) {
          case (?winner) json #= "\"" # winner # "\"";
          case null json #= "null";
        };
        json #= "}";
        first := false;
      };
      
      json #= "]}";
      
      return {
        status_code = 200;
        headers = [("Content-Type", "application/json")];
        body = Blob.toArray(Text.encodeUtf8(json));
      }
    };

    if (request.method == "GET" and Text.contains(path, #text "/tournament/bracket/matches/")) {
      let tournamentId = getTournamentIdFromPath(path);
      let matchesOpt = await getCurrentBracketMatches(tournamentId);
      
      switch (matchesOpt) {
        case null {
          return {
            status_code = 404;
            headers = [("Content-Type", "application/json")];
            body = Blob.toArray(Text.encodeUtf8("{\"error\": \"Tournament not found\"}"));
          }
        };
        case (?matches) {
          var json = "{";
          json #= "\"tournamentId\": \"" # tournamentId # "\",";
          json #= "\"matches\": [";
          
          var first = true;
          for (match in matches.vals()) {
            if (not first) { json #= "," };
            json #= "{\"round\": " # Nat.toText(match.round) # ", \"position\": " # Nat.toText(match.position) # ",";
            json #= "\"player1\": \"" # match.player1 # "\", \"player2\": \"" # match.player2 # "\",";
            json #= "\"challengeId\": ";
            switch (match.challengeId) {
              case (?cid) json #= "\"" # cid # "\"";
              case null json #= "null";
            };
            json #= ", \"winner\": ";
            switch (match.winner) {
              case (?winner) json #= "\"" # winner # "\"";
              case null json #= "null";
            };
            json #= ", \"status\": \"" # match.status # "\"}";
            first := false;
          };
          
          json #= "]}";
          
          return {
            status_code = 200;
            headers = [("Content-Type", "application/json")];
            body = Blob.toArray(Text.encodeUtf8(json));
          }
        }
      }
    };
    
    // Challenge Expiration Endpoints
    if (request.method == "GET" and path == "/challenges/expiring") {
      let hours = getQueryParamNat(request.url, "hours", 6);
      var expiring : [(ChallengeId, ChallengeInfo)] = [];
      let now = Nat64.fromNat(Int.abs(Time.now()));
      let threshold = Nat64.fromNat(hours) * 3600; // Convert hours to seconds
      
      for ((id, challenge) in challenges.entries()) {
        if (challenge.status == 1 and now > challenge.expiresAt - threshold and now <= challenge.expiresAt) {
          expiring := Array.append<(ChallengeId, ChallengeInfo)>(expiring, [(id, challenge)]);
        };
      };
      
      let jsonResponse = challengeListToJson(expiring);
      return {
        status_code = 200;
        headers = [("Content-Type", "application/json")];
        body = Blob.toArray(Text.encodeUtf8(jsonResponse));
      }
    };
    
    if (request.method == "GET" and path == "/challenges/stale") {
      var stale : [(ChallengeId, ChallengeInfo)] = [];
      let now = Nat64.fromNat(Int.abs(Time.now()));
      
      for ((id, challenge) in challenges.entries()) {
        if (challenge.status == 1 and now > challenge.expiresAt and now <= challenge.expiresAt + challenge.autoResolveThreshold) {
          stale := Array.append<(ChallengeId, ChallengeInfo)>(stale, [(id, challenge)]);
        };
      };
      
      let jsonResponse = challengeListToJson(stale);
      return {
        status_code = 200;
        headers = [("Content-Type", "application/json")];
        body = Blob.toArray(Text.encodeUtf8(jsonResponse));
      }
    };
    
    if (request.method == "GET" and path == "/challenges/expired") {
      var expired : [ChallengeId] = [];
      let now = Nat64.fromNat(Int.abs(Time.now()));
      
      for ((id, challenge) in challenges.entries()) {
        if (challenge.status == 1 and now > challenge.expiresAt + challenge.autoResolveThreshold) {
          expired := Array.append<ChallengeId>(expired, [id]);
        };
      };
      
      var result : [(ChallengeId, ChallengeInfo)] = [];
      for (id in expired.vals()) {
        switch (challenges.get(id)) {
          case (?challenge) result := Array.append<(ChallengeId, ChallengeInfo)>(result, [(id, challenge)]);
          case null {};
        };
      };
      
      let jsonResponse = challengeListToJson(result);
      return {
        status_code = 200;
        headers = [("Content-Type", "application/json")];
        body = Blob.toArray(Text.encodeUtf8(jsonResponse));
      }
    };
    
    // Auto-resolve expired challenges endpoint (POST to trigger batch resolution)
    if (request.method == "POST" and path == "/challenges/auto-resolve") {
      // Note: This would need to be handled by a separate shared function
      // For now, return a placeholder response
      let jsonResponse = "{\"message\":\"Use the autoResolveAllExpiredChallenges function directly\"}";
      return {
        status_code = 200;
        headers = [("Content-Type", "application/json")];
        body = Blob.toArray(Text.encodeUtf8(jsonResponse));
      }
    };
    
    // Official Games Registry Endpoint
    if (request.method == "GET" and path == "/official-games") {
      var officialGamesList : [(Text, { name : Text; description : Text; category : Text; createdBy : Address; createdAt : Nat64 })] = [];
      for ((gameId, _) in officialGames.entries()) {
        switch (gameMetadata.get(gameId)) {
          case (?metadata) { 
            officialGamesList := Array.append<(Text, { name : Text; description : Text; category : Text; createdBy : Address; createdAt : Nat64 })>(officialGamesList, [(gameId, metadata)]) 
          };
          case null {};
        }
      };
      let jsonResponse = gameListToJson(officialGamesList);
      return {
        status_code = 200;
        headers = [("Content-Type", "application/json")];
        body = Blob.toArray(Text.encodeUtf8(jsonResponse));
      }
    };
    
    // Game Details Endpoint
    if (request.method == "GET" and Text.contains(path, #text "/game/")) {
      let gameId = getGameIdFromPath(path);
      switch (gameMetadata.get(gameId)) {
        case (?metadata) {
          let moderators = switch (gameModerators.get(gameId)) { case (?xs) xs; case null [] };
          let rules = switch (rulesByGame.get(gameId)) { case (?xs) xs; case null [] };
          let isOfficial = switch (officialGames.get(gameId)) { case (?o) o; case null false };
          let minBet = switch (minBetByGame.get(gameId)) { case (?b) b; case null 0 };
          
          let jsonResponse = "{" # 
            "\"gameId\":\"" # gameId # "\"," #
            "\"name\":\"" # metadata.name # "\"," #
            "\"description\":\"" # metadata.description # "\"," #
            "\"category\":\"" # metadata.category # "\"," #
            "\"createdBy\":\"" # metadata.createdBy # "\"," #
            "\"createdAt\":" # Nat64.toText(metadata.createdAt) # "," #
            "\"moderators\":" # addressesToJson(moderators) # "," #
            "\"rulesCount\":" # Nat.toText(rules.size()) # "," #
            "\"isOfficial\":" # (if (isOfficial) "true" else "false") # "," #
            "\"minBet\":" # Nat.toText(minBet) #
            "}";
          
          return {
            status_code = 200;
            headers = [("Content-Type", "application/json")];
            body = Blob.toArray(Text.encodeUtf8(jsonResponse));
          }
        };
        case null {
          return {
            status_code = 404;
            headers = [("Content-Type", "application/json")];
            body = Blob.toArray(Text.encodeUtf8("{\"error\":\"Game not found\"}"));
          }
        };
      }
    };
    
    // Rules Summary Endpoint
    if (request.method == "GET" and Text.contains(path, #text "/rules-summary/")) {
      let gameId = getGameIdFromPath(path);
      switch (rulesByGame.get(gameId)) {
        case (?rules) {
          var officialRule : ?Ruleset = null;
          var topVotedRule : ?Ruleset = null;
          var maxVotes = 0;
          
          for (rule in rules.vals()) {
            if (rule.official) {
              officialRule := ?rule;
            };
            if (rule.votes > maxVotes) {
              maxVotes := rule.votes;
              topVotedRule := ?rule;
            }
          };
          
          let jsonResponse = "{" #
            "\"gameId\":\"" # gameId # "\"," #
            "\"totalRules\":" # Nat.toText(rules.size()) # "," #
            "\"hasOfficialRule\":" # (if (officialRule != null) "true" else "false") # "," #
            "\"hasTopVotedRule\":" # (if (topVotedRule != null) "true" else "false") # "," #
            "\"topVotedRule\":" # (switch (topVotedRule) { case (?r) rulesetToJson(r); case null "null" }) #
            "}";
          
          return {
            status_code = 200;
            headers = [("Content-Type", "application/json")];
            body = Blob.toArray(Text.encodeUtf8(jsonResponse));
          }
        };
        case null {
          return {
            status_code = 200;
            headers = [("Content-Type", "application/json")];
            body = Blob.toArray(Text.encodeUtf8("{\"gameId\":\"" # gameId # "\",\"totalRules\":0,\"hasOfficialRule\":false,\"hasTopVotedRule\":false,\"topVotedRule\":null}"));
          }
        }
      }
    };
    
    // Game Moderators Endpoint
    if (request.method == "GET" and Text.contains(path, #text "/moderators/")) {
      let gameId = getGameIdFromPath(path);
      let moderators = switch (gameModerators.get(gameId)) { case (?xs) xs; case null [] };
      let jsonResponse = addressesToJson(moderators);
      
      return {
        status_code = 200;
        headers = [("Content-Type", "application/json")];
        body = Blob.toArray(Text.encodeUtf8(jsonResponse));
      }
    };
    
    // Popular Games Analytics Endpoint
    if (request.method == "GET" and path == "/analytics/popular-games") {
      let popularGames = await getPopularGames();
      var json = "[";
      var first = true;
      for ((gameId, count) in popularGames.vals()) {
        if (not first) { json := json # "," };
        json := json # "{\"gameId\":\"" # gameId # "\",\"tournamentCount\":" # Nat.toText(count) # "}";
        first := false;
      };
      json := json # "]";
      
      return {
        status_code = 200;
        headers = [("Content-Type", "application/json")];
        body = Blob.toArray(Text.encodeUtf8(json));
      }
    };
    
    // Top Voted Rules Endpoint
    if (request.method == "GET" and path == "/analytics/top-rules") {
      let topRules = await getTopVotedRules();
      var json = "[";
      var first = true;
      for ((gameId, rule) in topRules.vals()) {
        if (not first) { json := json # "," };
        json := json # "{\"gameId\":\"" # gameId # "\",\"rule\":" # rulesetToJson(rule) # "}";
        first := false;
      };
      json := json # "]";
      
      return {
        status_code = 200;
        headers = [("Content-Type", "application/json")];
        body = Blob.toArray(Text.encodeUtf8(json));
      }
    };
    
    // Rules Needing Promotion Endpoint
    if (request.method == "GET" and path == "/analytics/rules-needing-promotion") {
      let needsPromotion = await getRulesNeedingPromotion();
      var json = "[";
      var first = true;
      for ((gameId, rule) in needsPromotion.vals()) {
        if (not first) { json := json # "," };
        json := json # "{\"gameId\":\"" # gameId # "\",\"rule\":" # rulesetToJson(rule) # "}";
        first := false;
      };
      json := json # "]";
      
      return {
        status_code = 200;
        headers = [("Content-Type", "application/json")];
        body = Blob.toArray(Text.encodeUtf8(json));
      }
    };
    
    // Tournament Refund Logs Endpoint
    if (request.method == "GET" and path == "/tournaments/refunds") {
      let tournamentId = getQueryParamText(request.url, "tournamentId", null);
      var refundLogs : [TournamentRefundLog] = [];
      
      switch (tournamentId) {
        case (?id) {
          switch (tournamentRefunds.get(id)) {
            case (?logs) { refundLogs := logs };
            case null {};
          };
        };
        case null {
          // Return all refund logs if no specific tournament
          for ((_, logs) in tournamentRefunds.entries()) {
            for (log in logs.vals()) {
              refundLogs := Array.append(refundLogs, [log]);
            };
          };
        };
      };
      
      var json = "[";
      var first = true;
      for (log in refundLogs.vals()) {
        if (not first) { json := json # "," };
        json := json # "{";
        json := json # "\"tournamentId\":\"" # log.tournamentId # "\",";
        json := json # "\"moderator\":\"" # log.moderator # "\",";
        json := json # "\"refundAmount\":" # Nat.toText(log.refundAmount) # ",";
        json := json # "\"refundToken\":\"" # log.refundToken # "\",";
        json := json # "\"refundReason\":\"" # log.refundReason # "\",";
        json := json # "\"timestamp\":" # Nat64.toText(log.timestamp) # ",";
        json := json # "\"totalRefunded\":" # Nat.toText(log.totalRefunded);
        json := json # "}";
        first := false;
      };
      json := json # "]";
      
      return {
        status_code = 200;
        headers = [("Content-Type", "application/json")];
        body = Blob.toArray(Text.encodeUtf8(json));
      }
    };
    
    // Moderator Actions Endpoint
    if (request.method == "GET" and path == "/tournaments/moderator-actions") {
      let tournamentId = getQueryParamText(request.url, "tournamentId", null);
      var actionLogs : [ModeratorActionLog] = [];
      
      switch (tournamentId) {
        case (?id) {
          switch (moderatorActions.get(id)) {
            case (?logs) { actionLogs := logs };
            case null {};
          };
        };
        case null {
          // Return all action logs if no specific tournament
          for ((_, logs) in moderatorActions.entries()) {
            for (log in logs.vals()) {
              actionLogs := Array.append(actionLogs, [log]);
            };
          };
        };
      };
      
      var json = "[";
      var first = true;
      for (log in actionLogs.vals()) {
        if (not first) { json := json # "," };
        json := json # "{";
        json := json # "\"tournamentId\":\"" # log.tournamentId # "\",";
        json := json # "\"moderator\":\"" # log.moderator # "\",";
        let actionTypeText = switch (log.actionType) {
          case (#Cancel) "Cancel";
          case (#Disqualify) "Disqualify";
          case (#Refund) "Refund";
          case (#ExtendDeadline) "ExtendDeadline";
          case (#ForceAdvance) "ForceAdvance";
        };
        json := json # "\"actionType\":\"" # actionTypeText # "\",";
        json := json # "\"actionReason\":\"" # log.actionReason # "\",";
        json := json # "\"timestamp\":" # Nat64.toText(log.timestamp) # ",";
        json := json # "\"metadata\":\"" # log.metadata # "\"";
        json := json # "}";
        first := false;
      };
      json := json # "]";
      
      return {
        status_code = 200;
        headers = [("Content-Type", "application/json")];
        body = Blob.toArray(Text.encodeUtf8(json));
      }
    };
    
    // Team Management Endpoints
    if (request.method == "GET" and path == "/teams") {
      let teamsList = await listTeams();
      var json = "[";
      var first = true;
      for ((teamId, team) in teamsList.vals()) {
        if (not first) { json := json # "," };
        json := json # "{";
        json := json # "\"teamId\":\"" # teamId # "\",";
        json := json # "\"name\":\"" # team.name # "\",";
        json := json # "\"captain\":\"" # team.captain # "\",";
        json := json # "\"members\":" # Nat.toText(team.members.size()) # ",";
        json := json # "\"avatar\":\"" # team.avatar # "\",";
        json := json # "\"description\":\"" # team.description # "\",";
        json := json # "\"tournamentWins\":" # Nat.toText(team.tournamentWins) # ",";
        json := json # "\"tournamentLosses\":" # Nat.toText(team.tournamentLosses) # ",";
        json := json # "\"totalEarnings\":" # Nat.toText(team.totalEarnings) # ",";
        json := json # "\"isActive\":" # (if (team.isActive) "true" else "false");
        json := json # "}";
        first := false;
      };
      json := json # "]";
      
      return {
        status_code = 200;
        headers = [("Content-Type", "application/json")];
        body = Blob.toArray(Text.encodeUtf8(json));
      }
    };
    
    if (request.method == "GET" and path == "/teams/details") {
      let teamId = getQueryParamText(request.url, "teamId", null);
      switch (teamId) {
        case (?id) {
          switch (await getTeamInfo(id)) {
            case (?team) {
              var json = "{";
              json := json # "\"teamId\":\"" # team.id # "\",";
              json := json # "\"name\":\"" # team.name # "\",";
              json := json # "\"captain\":\"" # team.captain # "\",";
              json := json # "\"members\":" # Nat.toText(team.members.size()) # ",";
              json := json # "\"avatar\":\"" # team.avatar # "\",";
              json := json # "\"description\":\"" # team.description # "\",";
              json := json # "\"gameSpecialties\":" # arrayToJson(team.gameSpecialties) # ",";
              json := json # "\"tournamentWins\":" # Nat.toText(team.tournamentWins) # ",";
              json := json # "\"tournamentLosses\":" # Nat.toText(team.tournamentLosses) # ",";
              json := json # "\"totalEarnings\":" # Nat.toText(team.totalEarnings) # ",";
              json := json # "\"isActive\":" # (if (team.isActive) "true" else "false");
              json := json # "}";
              
              return {
                status_code = 200;
                headers = [("Content-Type", "application/json")];
                body = Blob.toArray(Text.encodeUtf8(json));
              }
            };
            case null {
              return {
                status_code = 404;
                headers = [("Content-Type", "application/json")];
                body = Blob.toArray(Text.encodeUtf8("{\"error\":\"Team not found\"}"));
              }
            };
          };
        };
        case null {
          return {
            status_code = 400;
            headers = [("Content-Type", "application/json")];
            body = Blob.toArray(Text.encodeUtf8("{\"error\":\"teamId parameter required\"}"));
          }
        };
      };
    };
    
    if (request.method == "GET" and path == "/teams/player") {
      let player = getQueryParamText(request.url, "player", null);
      switch (player) {
        case (?addr) {
          switch (await getPlayerTeam(addr)) {
            case (?teamId) {
              return {
                status_code = 200;
                headers = [("Content-Type", "application/json")];
                body = Blob.toArray(Text.encodeUtf8("{\"teamId\":\"" # teamId # "\"}"));
              }
            };
            case null {
              return {
                status_code = 404;
                headers = [("Content-Type", "application/json")];
                body = Blob.toArray(Text.encodeUtf8("{\"error\":\"Player not in a team\"}"));
              }
            };
          };
        };
        case null {
          return {
            status_code = 400;
            headers = [("Content-Type", "application/json")];
            body = Blob.toArray(Text.encodeUtf8("{\"error\":\"player parameter required\"}"));
          }
        };
      };
    };
    
    // Mutual cancellation endpoint
    if (request.method == "POST" and path == "/challenges/mutual-cancel") {
      let bodyText = Text.decodeUtf8(Blob.fromArray(request.body));
      switch (bodyText) {
        case (?text) {
          let challengeId = extractJson(text, "challengeId");
          let player = extractJson(text, "player");
          let serviceFee = extractJson(text, "serviceFee");
          
          switch (challengeId, player, serviceFee) {
            case (?cid, ?p, ?sf) {
              let fee = switch (Nat.fromText(sf)) { case (?f) f; case null 0 };
              let success = await requestMutualCancel(cid, p, fee);
              
              if (success) {
                return {
                  status_code = 200;
                  headers = [("Content-Type", "application/json")];
                  body = Blob.toArray(Text.encodeUtf8("{\"success\":true,\"message\":\"Challenge mutually cancelled\"}"));
                }
              } else {
                return {
                  status_code = 400;
                  headers = [("Content-Type", "application/json")];
                  body = Blob.toArray(Text.encodeUtf8("{\"success\":false,\"message\":\"Failed to cancel challenge\"}"));
                }
              }
            };
            case _ {
              return {
                status_code = 400;
                headers = [("Content-Type", "application/json")];
                body = Blob.toArray(Text.encodeUtf8("{\"error\":\"Missing required parameters\"}"));
              }
            };
          }
        };
        case null {
          return {
            status_code = 400;
            headers = [("Content-Type", "application/json")];
            body = Blob.toArray(Text.encodeUtf8("{\"error\":\"Invalid request body\"}"));
          }
        }
      }
    };


    if (request.method == "POST" and path == "/challenges/payout/claim") {
      let bodyText = Text.decodeUtf8(Blob.fromArray(request.body));
      switch (bodyText) {
        case (?text) {
          let challengeId = extractJson(text, "challengeId");
          let potT = extractJson(text, "pot");
          let winner = extractJson(text, "winner");
          let feeT = extractJson(text, "serviceFee");
          switch (challengeId, potT, winner, feeT) {
            case (?cid, ?pt, ?w, ?ft) {
              let pot = switch (Nat.fromText(pt)) { case (?n) n; case null 0 };
              let fee = switch (Nat.fromText(ft)) { case (?n) n; case null 0 };
              let ok = await claimChallenge(cid, pot, w, fee);
              if (ok) { return { status_code = 200; headers = [("Content-Type", "application/json")]; body = Blob.toArray(Text.encodeUtf8("{\"success\":true}")) } } else { return { status_code = 400; headers = [("Content-Type", "application/json")]; body = Blob.toArray(Text.encodeUtf8("{\"error\":\"claim failed\"}")) } }
            };
            case _ { return { status_code = 400; headers = [("Content-Type", "application/json")]; body = Blob.toArray(Text.encodeUtf8("{\"error\":\"invalid fields\"}")) } }
          }
        };
        case null { return { status_code = 400; headers = [("Content-Type", "application/json")]; body = Blob.toArray(Text.encodeUtf8("{\"error\":\"invalid body\"}")) } }
      }
    };

    if (request.method == "POST" and path == "/challenges/set-token") {
      let bodyText = Text.decodeUtf8(Blob.fromArray(request.body));
      switch (bodyText) {
        case (?text) {
          let challengeId = extractJson(text, "challengeId");
          let tokenType = extractJson(text, "tokenType"); // ICP | ICRC
          let canisterId = extractJson(text, "canisterId");
          let mint = extractJson(text, "mint");
          switch (challengeId, tokenType) {
            case (?cid, ?tt) {
              let composed = if (tt == "ICRC") {
                switch (canisterId) { case (?c) { "ICRC:" # c }; case null { "ICRC" } }
              } else { tt };
              switch (challenges.get(cid)) {
                case (?c) { challenges.put(cid, { c with payToken = composed });
                  return { status_code = 200; headers = [("Content-Type", "application/json")]; body = Blob.toArray(Text.encodeUtf8("{\"success\":true}")) } };
                case null {
                  return { status_code = 404; headers = [("Content-Type", "application/json")]; body = Blob.toArray(Text.encodeUtf8("{\"error\":\"challenge not found\"}")) }
                }
              }
            };
            case _ {
              return { status_code = 400; headers = [("Content-Type", "application/json")]; body = Blob.toArray(Text.encodeUtf8("{\"error\":\"challengeId, tokenType required\"}")) }
            }
          }
        };
        case null {
          return { status_code = 400; headers = [("Content-Type", "application/json")]; body = Blob.toArray(Text.encodeUtf8("{\"error\":\"invalid body\"}")) }
        }
      }
    };

    if (request.method == "POST" and path == "/tournaments/set-token") {
      let bodyText = Text.decodeUtf8(Blob.fromArray(request.body));
      switch (bodyText) {
        case (?text) {
          let tournamentId = extractJson(text, "tournamentId");
          let tokenType = extractJson(text, "tokenType");
          let canisterId = extractJson(text, "canisterId");
          let mint = extractJson(text, "mint");
          switch (tournamentId, tokenType) {
            case (?tid, ?tt) {
              let composed = if (tt == "ICRC") {
                switch (canisterId) { case (?c) { "ICRC:" # c }; case null { "ICRC" } }
              } else { tt };
              switch (tournaments.get(tid)) {
                case (?t) { tournaments.put(tid, { t with payToken = composed });
                  return { status_code = 200; headers = [("Content-Type", "application/json")]; body = Blob.toArray(Text.encodeUtf8("{\"success\":true}")) } };
                case null {
                  return { status_code = 404; headers = [("Content-Type", "application/json")]; body = Blob.toArray(Text.encodeUtf8("{\"error\":\"tournament not found\"}")) }
                }
              }
            };
            case _ {
              return { status_code = 400; headers = [("Content-Type", "application/json")]; body = Blob.toArray(Text.encodeUtf8("{\"error\":\"tournamentId, tokenType required\"}")) }
            }
          }
        };
        case null {
          return { status_code = 400; headers = [("Content-Type", "application/json")]; body = Blob.toArray(Text.encodeUtf8("{\"error\":\"invalid body\"}")) }
        }
      }
    };
    
    // Apply as BaseReferee
    if (request.method == "POST" and path == "/moderators/apply") {
      let bodyText = Text.decodeUtf8(Blob.fromArray(request.body));
      switch (bodyText) {
        case (?text) {
          let address = extractJson(text, "address");
          switch (address) {
            case (?a) {
              let ok = await applyBaseReferee(a);
              if (ok) {
                return {
                  status_code = 200;
                  headers = [("Content-Type", "application/json")];
                  body = Blob.toArray(Text.encodeUtf8("{\"success\":true}"));
                }
              } else {
                return {
                  status_code = 400;
                  headers = [("Content-Type", "application/json")];
                  body = Blob.toArray(Text.encodeUtf8("{\"success\":false}"));
                }
              }
            };
            case null {
              return {
                status_code = 400;
                headers = [("Content-Type", "application/json")];
                body = Blob.toArray(Text.encodeUtf8("{\"error\":\"address required\"}"));
              }
            }
          }
        };
        case null {
          return {
            status_code = 400;
            headers = [("Content-Type", "application/json")];
            body = Blob.toArray(Text.encodeUtf8("{\"error\":\"invalid body\"}"));
          }
        }
      }
    };
    
    
    // 404 Not Found
    return {
      status_code = 404;
      headers = [("Content-Type", "application/json")];
      body = Blob.toArray(Text.encodeUtf8("{\"error\":\"Endpoint not found\"}"));
    }
  };

  // Minimal query handler for Web4
  public query func http_request(request : {
    method : Text;
    url : Text;
    headers : [(Text, Text)];
    body : [Nat8];
  }) : async {
    status_code : Nat16;
    headers : [(Text, Text)];
    body : [Nat8];
  } {
    return {
      status_code = 200;
      headers = [("Content-Type", "application/json")];
      body = Blob.toArray(Text.encodeUtf8("{\"status\":\"ok\"}"));
    };
  };

  // Helper functions for JSON serialization
  func getGameIdFromPath(path : Text) : Text {
    // Extract game ID from path like "/rules/game123"
    let parts = Text.split(path, #char '/');
    var gameId = "";
    for (part in parts) {
      if (part != "" and part != "rules" and part != "official") {
        gameId := part;
        return gameId;
      }
    };
    gameId
  };

  func gameListToJson(games : [(Text, { name : Text; description : Text; category : Text; createdBy : Address; createdAt : Nat64 })]) : Text {
    var json = "[";
    var first = true;
    for ((gameId, metadata) in games.vals()) {
      if (not first) { json := json # "," };
      json := json # "{\"gameId\":\"" # gameId # "\",\"name\":\"" # metadata.name # "\",\"description\":\"" # metadata.description # "\",\"category\":\"" # metadata.category # "\",\"createdBy\":\"" # metadata.createdBy # "\",\"createdAt\":" # Nat64.toText(metadata.createdAt) # "}";
      first := false;
    };
    json # "]"
  };

  func rulesListToJson(rules : [Ruleset]) : Text {
    var json = "[";
    var first = true;
    for (rule in rules.vals()) {
      if (not first) { json := json # "," };
      json := json # "{\"id\":" # Nat.toText(rule.id) # ",\"title\":\"" # rule.title # "\",\"settings\":\"" # rule.settings # "\",\"votes\":" # Nat.toText(rule.votes) # ",\"official\":" # (if (rule.official) "true" else "false") # "}";
      first := false;
    };
    json # "]"
  };

  func rulesetToJson(rule : Ruleset) : Text {
    "{\"id\":" # Nat.toText(rule.id) # ",\"title\":\"" # rule.title # "\",\"settings\":\"" # rule.settings # "\",\"votes\":" # Nat.toText(rule.votes) # ",\"official\":" # (if (rule.official) "true" else "false") # "}"
  };

  func tokensListToJson(tokens : [(Text, TokenInfo)]) : Text {
    var json = "[";
    var first = true;
    for ((tokenId, info) in tokens.vals()) {
      if (not first) { json := json # "," };
      json := json # "{\"tokenId\":\"" # tokenId # "\",\"name\":\"" # info.name # "\",\"symbol\":\"" # info.symbol # "\",\"decimals\":" # Nat8.toText(info.decimals) # ",\"fee\":" # Nat.toText(info.fee) # "}";
      first := false;
    };
    json # "]"
  };

  func treasuryTransactionsToJson(transactions : [TreasuryTransaction]) : Text {
    var json = "[";
    var first = true;
    for (tx in transactions.vals()) {
      if (not first) { json := json # "," };
      let txType = switch (tx.transactionType) {
        case (#Deposit) "deposit";
        case (#Withdrawal) "withdrawal";
        case (#RakeCollection) "rake";
        case (#PrizeDistribution) "prize";
        case (#PlatformFee) "fee";
        case (#TreasuryAllocation) "allocation";
      };
      
      let fromAddr = switch (tx.fromAddress) {
        case (?addr) "\"" # addr # "\"";
        case null "null";
      };
      
      let toAddr = switch (tx.toAddress) {
        case (?addr) "\"" # addr # "\"";
        case null "null";
      };
      
      let challengeId = switch (tx.challengeId) {
        case (?id) "\"" # id # "\"";
        case null "null";
      };
      
      let tournamentId = switch (tx.tournamentId) {
        case (?id) "\"" # id # "\"";
        case null "null";
      };
      
      json := json # "{\"id\":\"" # tx.id # "\",\"timestamp\":" # Nat64.toText(tx.timestamp) # ",\"type\":\"" # txType # "\",\"token\":\"" # tx.tokenType # "\",\"amount\":" # Nat.toText(tx.amount) # ",\"fromAddress\":" # fromAddr # ",\"toAddress\":" # toAddr # ",\"challengeId\":" # challengeId # ",\"tournamentId\":" # tournamentId # ",\"description\":\"" # tx.description # "\"}";
      first := false;
    };
    json # "]"
  };

  func treasurySummaryToJson(summary : [(Text, Nat)]) : Text {
    var json = "[";
    var first = true;
    for ((token, balance) in summary.vals()) {
      if (not first) { json := json # "," };
      json := json # "{\"token\":\"" # token # "\",\"balance\":" # Nat.toText(balance) # "}";
      first := false;
    };
    json # "]"
  };

  func getQueryParam(url : Text, param : Text) : ?Text {
    // Parse URL query parameters
    let parts = Text.split(url, #char '?');
    var queryString = "";
    for (part in parts) {
      queryString := part;
    };
    
    if (queryString == url) { return null }; // No query string
    
    let params = Text.split(queryString, #char '&');
    for (paramPair in params) {
      let pairParts = Text.split(paramPair, #char '=');
      var key = "";
      var value = "";
      var isKey = true;
      for (part in pairParts) {
        if (isKey) {
          key := part;
          isKey := false;
        } else {
          value := part;
        };
      };
      if (key == param) {
        return ?value;
      };
    };
    null
  };
  
  func getQueryParamNat(url : Text, param : Text, defaultValue : Nat) : Nat {
    switch (getQueryParam(url, param)) {
      case (?value) {
        switch (Nat.fromText(value)) {
          case (?n) n;
          case null defaultValue;
        }
      };
      case null defaultValue;
    }
  };
  
  func getTokenIdFromPath(path : Text) : Text {
    // Extract token ID from path like "/treasury/balance/ICP"
    let parts = Text.split(path, #char '/');
    var tokenId = "";
    var foundBalance = false;
    for (part in parts) {
      if (foundBalance and part != "") {
        tokenId := part;
        return tokenId;
      };
      if (part == "balance") {
        foundBalance := true;
      };
    };
    ""
  };

  func tournamentListToJson(tournaments : [(TournamentId, TournamentInfo)]) : Text {
    var json = "[";
    var first = true;
    for ((id, info) in tournaments.vals()) {
      if (not first) { json := json # "," };
      json := json # "{\"tournamentId\":\"" # id # "\",\"creator\":\"" # info.creator # "\",\"entryFee\":" # Nat.toText(info.entryFee) # ",\"maxParticipants\":" # Nat.toText(info.maxParticipants) # ",\"gameType\":\"" # info.gameType # "\",\"status\":" # Nat.toText(info.status) # ",\"totalPrizePool\":" # Nat.toText(info.totalPrizePool) # "}";
      first := false;
    };
    json # "]"
  };

  func challengeListToJson(challenges : [(ChallengeId, ChallengeInfo)]) : Text {
    var json = "[";
    var first = true;
    for ((id, info) in challenges.vals()) {
      if (not first) { json := json # "," };
      let statusName = switch (info.status) {
        case (0) "cancelled";
        case (1) "open";
        case (2) "in_progress";
        case (3) "scored";
        case (4) "confirmed";
        case (5) "disputed";
        case (6) "mutually_cancelled";
        case (_) "unknown";
      };
      json := json # "{\"challengeId\":\"" # id # "\",\"creator\":\"" # info.creator # "\",\"opponent\":\"" # info.opponent # "\",\"status\":\"" # statusName # "\",\"gameType\":\"" # info.gameType # "\",\"tournament\":\"" # info.tournament # "\"}";
      first := false;
    };
    json # "]"
  };

  func moderatorListToJson(moderators : [Moderator]) : Text {
    var json = "[";
    var first = true;
    for (mod in moderators.vals()) {
      if (not first) { json := json # "," };
      let roleName = switch (mod.role) {
        case (#BaseReferee) "BaseReferee";
        case (#VettedMod) "VettedMod";
        case (#SuperMod) "SuperMod";
        case (#AdminMod) "AdminMod";
      };
      json := json # "{\"wallet\":\"" # mod.wallet # "\",\"role\":\"" # roleName # "\",\"appointedAt\":" # Nat64.toText(mod.appointedAt) # ",\"gamesRefereed\":" # Nat.toText(mod.gamesRefereed) # ",\"disputesResolved\":" # Nat.toText(mod.disputesResolved) # ",\"upvotesReceived\":" # Nat.toText(mod.upvotesReceived) # "}";
      first := false;
    };
    json # "]"
  };

  func disputeListToJson(disputes : [Dispute]) : Text {
    var json = "[";
    var first = true;
    for (dispute in disputes.vals()) {
      if (not first) { json := json # "," };
      let statusName = switch (dispute.status) {
        case (#Active) "Active";
        case (#Resolved) "Resolved";
        case (#Cancelled) "Cancelled";
      };
      json := json # "{\"challengeId\":\"" # dispute.challengeId # "\",\"disputedBy\":\"" # dispute.disputedBy # "\",\"disputedAt\":" # Nat64.toText(dispute.disputedAt) # ",\"status\":\"" # statusName # "\",\"votes\":" # Nat.toText(dispute.votes.size()) # ",\"expiresAt\":" # Nat64.toText(dispute.expiresAt) # "}";
      first := false;
    };
    json # "]"
  };

  func addressesToJson(addresses : [Address]) : Text {
    var json = "[";
    var first = true;
    for (addr in addresses.vals()) {
      if (not first) { json := json # "," };
      json := json # "\"" # addr # "\"";
      first := false;
    };
    json # "]"
  };

  func arrayToJson(items : [Text]) : Text {
    var json = "[";
    var first = true;
    for (item in items.vals()) {
      if (not first) { json := json # "," };
      json := json # "\"" # item # "\"";
      first := false;
    };
    json # "]"
  };

  // Helper function to extract JSON values from simple JSON strings
  func extractJsonValue(jsonText : Text, key : Text) : ?Text {
    extractJson(jsonText, key)
  };

  func extractJson(jsonText : Text, key : Text) : ?Text {
    let pat = "\"" # key # "\":";
    var rest = "";
    var got = false;
    for (seg in Text.split(jsonText, #text pat)) {
      if (not got) { got := true } else { if (Text.size(rest) == 0) { rest := seg } };
    };
    if (not got or Text.size(rest) == 0) { return null };

    var isQuoted = false;
    var started = false;
    var ended = false;
    var buf = "";
    for (ch in Text.toIter(rest)) {
      if (ended) {
        // do nothing
      } else if (not started) {
        if (ch == ' ' or ch == '\n' or ch == '\t') {
          // skip leading whitespace
        } else {
          started := true;
          if (ch == '\"') {
            isQuoted := true;
          } else {
            buf := buf # Char.toText(ch);
          };
        };
      } else {
        if (isQuoted) {
          if (ch == '\"') { ended := true } else { buf := buf # Char.toText(ch) };
        } else {
          if (ch == ',' or ch == '}') { ended := true } else { buf := buf # Char.toText(ch) };
        };
      };
    };
    let trimmed = do {
      var acc = "";
      var seen = false;
      for (ch in Text.toIter(buf)) {
        if (not seen and (ch == ' ' or ch == '\n' or ch == '\t')) {
        } else {
          seen := true;
          acc := acc # Char.toText(ch);
        };
      };
      acc
    };
    if (Text.size(trimmed) == 0) { null } else { ?trimmed }
  };

  // Convert allocation limits to JSON
  func allocationLimitsToJson(limits : [{ token : Text; limit : Nat; current : Nat }]) : Text {
    var json = "{\"allocations\":[";
    var first = true;
    for (limit in limits.vals()) {
      if (not first) { json := json # "," };
      json := json # "{\"token\":\"" # limit.token # "\",\"limit\":" # Nat.toText(limit.limit) # ",\"current\":" # Nat.toText(limit.current) # "}";
      first := false;
    };
    json # "]}"
  };

  

  public query func listAllModerators() : async [Moderator] {
    var moderatorList : [Moderator] = [];
    for (mod in moderators.vals()) {
      moderatorList := Array.append<Moderator>(moderatorList, [mod]);
    };
    moderatorList
  };

  // Enhanced rules and games analytics
  public query func getPopularGames() : async [(Text, Nat)] {
    var gamePopularity : [(Text, Nat)] = [];
    
    // Count tournaments per game
    for ((tournamentId, tournament) in tournaments.entries()) {
      let gameType = tournament.gameType;
      var found = false;
      var updatedList : [(Text, Nat)] = [];
      
      for ((gameId, count) in gamePopularity.vals()) {
        if (gameId == gameType) {
          updatedList := Array.append<(Text, Nat)>(updatedList, [(gameId, count + 1)]);
          found := true;
        } else {
          updatedList := Array.append<(Text, Nat)>(updatedList, [(gameId, count)]);
        }
      };
      
      if (not found) {
        gamePopularity := Array.append<(Text, Nat)>(gamePopularity, [(gameType, 1)]);
      } else {
        gamePopularity := updatedList;
      };
    };
    
    // Sort by popularity (descending)
    gamePopularity := Array.sort<(Text, Nat)>(gamePopularity, func (a : (Text, Nat), b : (Text, Nat)) : Order.Order {
      if (a.1 > b.1) { #less } else if (a.1 < b.1) { #greater } else { #equal }
    });
    
    gamePopularity
  };

  public query func getTopVotedRules() : async [(Text, Ruleset)] {
    var topRules : [(Text, Ruleset)] = [];
    
    for ((gameId, rules) in rulesByGame.entries()) {
      var maxVotes = 0;
      var topRule : ?Ruleset = null;
      
      for (rule in rules.vals()) {
        if (rule.votes > maxVotes) {
          maxVotes := rule.votes;
          topRule := ?rule;
        }
      };
      
      switch (topRule) {
        case (?rule) {
          topRules := Array.append<(Text, Ruleset)>(topRules, [(gameId, rule)]);
        };
        case null {};
      };
    };
    
    // Sort by votes (descending)
    topRules := Array.sort<(Text, Ruleset)>(topRules, func (a : (Text, Ruleset), b : (Text, Ruleset)) : Order.Order {
      if (a.1.votes > b.1.votes) { #less } else if (a.1.votes < b.1.votes) { #greater } else { #equal }
    });
    
    topRules
  };

  public query func getRulesNeedingPromotion() : async [(Text, Ruleset)] {
    var needsPromotion : [(Text, Ruleset)] = [];
    
    for ((gameId, rules) in rulesByGame.entries()) {
      var hasOfficial = false;
      var topVoted : ?Ruleset = null;
      var maxVotes = 0;
      
      // Find official rule and top voted rule
      for (rule in rules.vals()) {
        if (rule.official) {
          hasOfficial := true;
        };
        if (rule.votes > maxVotes) {
          maxVotes := rule.votes;
          topVoted := ?rule;
        }
      };
      
      // If no official rule and we have a top voted rule with sufficient votes
      if (not hasOfficial) {
        switch (topVoted) {
          case (?rule) {
            if (rule.votes >= 3) { // Minimum 3 votes to be considered for promotion
              needsPromotion := Array.append<(Text, Ruleset)>(needsPromotion, [(gameId, rule)]);
            }
          };
          case null {};
        };
      };
    };
    needsPromotion
  };

}
