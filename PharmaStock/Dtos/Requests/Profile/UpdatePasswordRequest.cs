namespace PharmaStock.Dtos.Requests.Profile
{
    public class UpdatePasswordRequest
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
        
        // This field is used for client-side validation to ensure the user has correctly entered their new password twice.
        public string ConfirmNewPassword { get; set; } = string.Empty;
    }
}