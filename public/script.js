function checkURL() {
    const url = document.getElementById('urlInput').value;
    fetch(`/check?url=${encodeURIComponent(url)}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById('result').innerText = data.isPhishing ? 'This URL is potentially dangerous.' : 'This URL is safe.';
        })
        .catch(error => console.error('Error:', error));
}
