function checkURL() {
    const url = document.getElementById('urlInput').value;
    if (!url) {
        alert('Please enter a URL.');
        return;
    }
    fetch(`/check?url=${encodeURIComponent(url)}`)
        .then(response => response.json())
        .then(data => {
            const resultText = data.isPhishing ? 'This URL is potentially dangerous.' : 'This URL is safe.';
            document.getElementById('result').innerText = resultText;
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to check the URL.');
        });
}
