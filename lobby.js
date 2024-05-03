document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('joinForm');
    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            if (event && event.target) {
                let invite = event.target.inviteLink.value;
                if (invite) {
                    window.location = `main.html?room=${invite}`;
                }
            }
        });
    }
});
