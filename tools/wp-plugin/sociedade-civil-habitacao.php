<?php
/**
 * Plugin Name:       Sociedade Civil — Habitação
 * Description:       Ferramenta cívica de habitação: quem resolve o teu problema, pedidos de documentos e participação. Numa página, usa o shortcode [sociedade_civil_habitacao].
 * Version:           1.0.0
 * Requires at least: 5.8
 * Requires PHP:      7.4
 * Author:            Sociedade Civil
 * License:           GPL-2.0-or-later
 * Text Domain:       sociedade-civil-habitacao
 *
 * O site completo está na pasta site/ deste plugin (HTML, CSS, JavaScript e JSON estáticos).
 * O shortcode mostra-o num iframe que ajusta a altura automaticamente. Não há base de dados,
 * contas, cookies nem envio de dados pessoais.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'SCH_HABITACAO_VERSAO', 'dev' );

/**
 * [sociedade_civil_habitacao pagina="index.html" altura="900"]
 *
 * pagina: index.html, quem-resolve.html, pedir-documentos.html, participar.html, sobre.html ou questoes-juridicas.html
 * altura: altura inicial em píxeis (ajustada automaticamente depois de carregar)
 */
function sch_habitacao_shortcode( $atts ) {
	$atts = shortcode_atts(
		array(
			'pagina' => 'index.html',
			'altura' => '900',
		),
		$atts,
		'sociedade_civil_habitacao'
	);

	$permitidas = array( 'index.html', 'quem-resolve.html', 'pedir-documentos.html', 'participar.html', 'sobre.html', 'questoes-juridicas.html' );
	$pagina     = in_array( $atts['pagina'], $permitidas, true ) ? $atts['pagina'] : 'index.html';
	$altura     = max( 400, min( 5000, intval( $atts['altura'] ) ) );
	$src        = add_query_arg( 'v', SCH_HABITACAO_VERSAO, plugins_url( 'site/' . $pagina, __FILE__ ) );
	$id         = 'sch-habitacao-' . wp_rand( 1000, 999999 );

	// Origem esperada das mensagens, calculada aqui e não a partir de frame.src no browser:
	// plugins de lazy load (ex.: Smush) trocam o src por uma imagem data: e a origem seria «null».
	$partes = wp_parse_url( $src );
	$origem = $partes['scheme'] . '://' . $partes['host'] . ( isset( $partes['port'] ) ? ':' . $partes['port'] : '' );

	ob_start();
	?>
	<div class="sch-embed">
		<iframe
			id="<?php echo esc_attr( $id ); ?>"
			class="no-lazyload skip-lazy"
			data-no-lazy="1"
			data-skip-lazy="1"
			loading="eager"
			title="<?php echo esc_attr__( 'Sociedade Civil — Habitação: quem resolve o teu problema de habitação', 'sociedade-civil-habitacao' ); ?>"
			src="<?php echo esc_url( $src ); ?>"
			referrerpolicy="strict-origin-when-cross-origin"
			allow="clipboard-write"
			style="display:block;width:100%;min-height:<?php echo (int) $altura; ?>px;border:0;background:#f4ede4;"
		></iframe>
		<p style="font-size:14px;margin:.5em 0 0;">
			<a href="<?php echo esc_url( $src ); ?>" target="_blank" rel="noopener"><?php esc_html_e( 'Abrir a ferramenta numa página própria ↗', 'sociedade-civil-habitacao' ); ?></a>
		</p>
	</div>
	<script>
	(function () {
		var frame = document.getElementById(<?php echo wp_json_encode( $id ); ?>);
		if (!frame) return;
		var origem = <?php echo wp_json_encode( $origem ); ?>;
		// Se um plugin de lazy load ainda assim substituiu o src, repõe o endereço real.
		var real = frame.getAttribute('data-src') || frame.getAttribute('data-lazy-src');
		if (real && /^data:/.test(frame.getAttribute('src') || '')) {
			frame.removeAttribute('data-src');
			frame.removeAttribute('data-lazy-src');
			frame.classList.remove('lazyload', 'lazyloading');
			frame.setAttribute('src', real);
		}
		window.addEventListener('message', function (ev) {
			if (ev.source !== frame.contentWindow || ev.origin !== origem || !ev.data || typeof ev.data !== 'object') return;
			if (ev.data.tipo === 'sch-altura' && typeof ev.data.altura === 'number' && ev.data.altura > 200 && ev.data.altura < 40000) {
				frame.style.height = ev.data.altura + 'px';
			}
			if (ev.data.tipo === 'sch-topo' && frame.getBoundingClientRect().top < 0) {
				window.scrollTo({ top: frame.getBoundingClientRect().top + window.pageYOffset - 80, behavior: 'smooth' });
			}
		});
	})();
	</script>
	<?php
	return ob_get_clean();
}
add_shortcode( 'sociedade_civil_habitacao', 'sch_habitacao_shortcode' );
