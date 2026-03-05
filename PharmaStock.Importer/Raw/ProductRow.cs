namespace PharmaStock.Importer.Raw;

public sealed class ProductRow
{
    public string? PRODUCTID { get; set; }
    public string? PRODUCTNDC { get; set; }
    public string? PRODUCTTYPENAME { get; set; }
    public string? PROPRIETARYNAME { get; set; }
    public string? PROPRIETARYNAMESUFFIX { get; set; }
    public string? NONPROPRIETARYNAME { get; set; }
    public string? DOSAGEFORMNAME { get; set; }
    public string? ROUTENAME { get; set; }
    public string? STARTMARKETINGDATE { get; set; }
    public string? ENDMARKETINGDATE { get; set; }
    public string? MARKETINGCATEGORYNAME { get; set; }
    public string? APPLICATIONNUMBER { get; set; }
    public string? LABELERNAME { get; set; }
    public string? SUBSTANCENAME { get; set; }
    public string? ACTIVE_NUMERATOR_STRENGTH { get; set; }
    public string? ACTIVE_INGRED_UNIT { get; set; }
    public string? PHARM_CLASSES { get; set; }
    public string? DEASCHEDULE { get; set; }
    public string? NDC_EXCLUDE_FLAG { get; set; }
    public string? LISTING_RECORD_CERTIFIED_THROUGH { get; set; }
}