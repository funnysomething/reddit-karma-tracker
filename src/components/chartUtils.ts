// Utility to add a synthetic 'Combined' user to the chart data for the combined view
export function getCombinedChartData(allUsersHistory) {
  if (!allUsersHistory || Object.keys(allUsersHistory).length < 2) return allUsersHistory;

  // Collect all unique timestamps
  const allTimestamps = new Set();
  Object.values(allUsersHistory).forEach((history) => {
    history.forEach((item) => allTimestamps.add(item.collected_at));
  });
  const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  // For each timestamp, sum all users' values
  const combinedHistory = sortedTimestamps.map((ts) => {
    let karma = 0, post_count = 0, comment_count = 0;
    Object.values(allUsersHistory).forEach((history) => {
      const item = history.find((h) => h.collected_at === ts);
      if (item) {
        karma += item.karma || 0;
        post_count += item.post_count || 0;
        comment_count += item.comment_count || 0;
      }
    });
    return {
      collected_at: ts,
      karma,
      post_count,
      comment_count
    };
  });

  return {
    ...allUsersHistory,
    Combined: combinedHistory
  };
}
