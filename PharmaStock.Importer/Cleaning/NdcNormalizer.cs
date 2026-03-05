using System.Text;

namespace PharmaStock.Importer.Cleaning;

public static class NdcNormalizer
{
    public static string? DigitsOnly(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return null;

        var sb = new StringBuilder(input.Length);
        foreach (var ch in input)
        {
            if (char.IsDigit(ch)) sb.Append(ch);
        }

        return sb.Length == 0 ? null : sb.ToString();
    }
}
