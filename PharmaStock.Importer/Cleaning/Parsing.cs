using System.Globalization;

namespace PharmaStock.Importer.Cleaning;

public static class Parsing
{
    // FDA files often use YYYYMMDD or blank
    public static DateOnly? DateOnlyFromYyyyMmDd(string? s)
    {
        s = s?.Trim();
        if (string.IsNullOrEmpty(s)) return null;

        if (DateOnly.TryParseExact(s, "yyyyMMdd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var d))
            return d;

        // fallback: try ISO-like
        if (DateOnly.TryParse(s, CultureInfo.InvariantCulture, DateTimeStyles.None, out d))
            return d;

        return null;
    }

    public static bool IsYes(string? s) =>
        string.Equals(s?.Trim(), "Y", StringComparison.OrdinalIgnoreCase);
}
