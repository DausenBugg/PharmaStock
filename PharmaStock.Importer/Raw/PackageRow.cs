namespace PharmaStock.Importer.Raw;

public sealed class PackageRow
{
    public string? PRODUCTID { get; set; }
    public string? PRODUCTNDC { get; set; }
    public string? NDCPACKAGECODE { get; set; }
    public string? PACKAGEDESCRIPTION { get; set; }
    public string? STARTMARKETINGDATE { get; set; }
    public string? ENDMARKETINGDATE { get; set; }
    public string? NDC_EXCLUDE_FLAG { get; set; }
    public string? SAMPLE_PACKAGE { get; set; }
}
