class FaceGif {

	/**
	 * Construct the facegif
	 */
	constructor(interval = 500) {
		this.interval = interval;
		this.$video = document.querySelector('.facegif__video');
		this.expression = 'neutral';
		this._init();
	}

	/**
	 * Set expressions gifs
	 *
	 * @returns {Promise<void>}
	 * @private
	 */
	async _setExpressionsGifs() {
		await fetch('./src/expressionsgifs.json')
		.then(response => response.json())
		.then(expressionsGifs => this.expressionsGifs = expressionsGifs)
		.catch(() => console.error('Could not load the expressions gifs.'));
	}

	/**
	 * Load models for face api
	 *
	 * @private
	 */
	async _loadModels() {
		await faceapi.nets.tinyFaceDetector.loadFromUri('./src/models');
		await faceapi.nets.faceExpressionNet.loadFromUri('./src/models');
	}

	/**
	 * Start video stream and stream it in the video object
	 *
	 * @private
	 */
	_startVideoStream() {
		if (!navigator.mediaDevices.getUserMedia) return;

		navigator.mediaDevices.getUserMedia({video: true, audio: false})
		.then(stream => this.$video.srcObject = stream)
		.catch(() => console.error('Something went wrong with the video streaming.'));
	}

	/**
	 * Get the expression of the face using hte faceapi
	 *
	 * @param expressions
	 * @return {String}
	 * @private
	 */
	_getExpression(expressions) {
		return Object.keys(expressions).reduce((precedentExpression, actualExpression) => expressions[precedentExpression] > expressions[actualExpression] ? precedentExpression : actualExpression) ?? 'neutral';
	}

	/**
	 * Get randoms gifs from the JSON
	 *
	 * @param expression current expression
	 * @param number number of random gifs
	 * @returns {[]}
	 * @private
	 */
	_randomGifs(expression, number) {
		const gifs = [];
		const gifsOfExpressions = JSON.parse(JSON.stringify(this.expressionsGifs[expression]));

		for (let i = 0 ; i <= number - 1 ; i++) {
			const randomGifNumber = Math.floor(Math.random() * gifsOfExpressions.length);
			const randomGif = gifsOfExpressions.splice(randomGifNumber, 1);

			gifs.push(randomGif[0]);
		}

		return gifs;
	}

	/**
	 * Init the facegif
	 *
	 * @private
	 */
	_init() {
		this._setExpressionsGifs().then(() => {
			this._startVideoStream();
			this._loadModels().then(() => {
				this.$video.addEventListener('play', () => {
					setInterval(async () => {
						const detections = await faceapi
						.detectAllFaces(this.$video, new faceapi.TinyFaceDetectorOptions())
						.withFaceExpressions();

						if (detections && detections[0] && detections[0].expressions) {
							const randomGifs = this._randomGifs(this._getExpression(detections[0].expressions), 3);
							document.querySelectorAll('.facegif__gif').forEach(($gif, index) => $gif.style.backgroundImage = `url(${randomGifs[index]})`);
						}
					}, this.interval);
				});
			});
		});
	}

}

new FaceGif();