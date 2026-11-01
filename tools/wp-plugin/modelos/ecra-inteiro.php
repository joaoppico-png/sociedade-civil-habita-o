<?php
/**
 * Modelo de página «Sociedade Civil — ecrã inteiro»: só a ferramenta, sem cabeçalho, menu nem rodapé do tema.
 *
 * Mantém wp_head() e wp_footer(), para o título, os metadados de SEO e a barra de administração.
 * Não chama wp_body_open(): alguns temas usam esse gancho para mostrar menus ou cabeçalhos.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<?php wp_head(); ?>
	<style>
		html, body.sch-ecra-inteiro { margin: 0 !important; padding: 0 !important; background: #f4ede4 !important; }
		.sch-ecra-inteiro .sch-embed iframe { min-height: 100vh !important; }
		.sch-ecra-inteiro .sch-embed p { margin: 0 !important; padding: 8px 16px 16px; font: 14px/1.4 system-ui, sans-serif; }
		.sch-titulo-oculto { position: absolute !important; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
	</style>
</head>
<body <?php body_class( 'sch-ecra-inteiro' ); ?>>
	<h1 class="sch-titulo-oculto"><?php echo esc_html( get_the_title() ); ?></h1>
	<?php echo sch_habitacao_shortcode( array( 'margem' => '0' ) ); // phpcs:ignore WordPress.Security.EscapeOutput -- o shortcode escapa o que imprime. ?>
	<?php wp_footer(); ?>
</body>
</html>
