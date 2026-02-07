namespace PharmaStock.Data.Entities
{

    public class TestMedication
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public int QuantityInStock { get; set; }

        public DateTime ExpirationDate { get; set; }

        public DateTime BeyondUseDate { get; set; }
        
        // This is for things like handle with care, keep refrigerated, store in dry place, use Desiccants, etc.
        // note: storage instructions not packaging instructions
        public string HandleInstructions { get; set; } = string.Empty;

    }
}