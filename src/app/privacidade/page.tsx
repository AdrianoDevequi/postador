import Link from "next/link";
import { LegalPage, CONTACT_EMAIL } from "../legal/LegalPage";

export const metadata = { title: "Política de Privacidade — Postador" };

export default function PrivacidadePage() {
    return (
        <LegalPage title="Política de Privacidade">
            <p>
                O Postador é uma ferramenta que gera e publica posts em contas do Instagram a pedido do próprio titular
                da conta. Esta política descreve quais dados coletamos, por que, e como você pode removê-los.
            </p>

            <h2>Dados que coletamos</h2>
            <ul>
                <li>
                    <strong>Cadastro:</strong> e-mail e senha (armazenada apenas como hash, nunca em texto puro).
                </li>
                <li>
                    <strong>Conta do Instagram:</strong> ao clicar em &quot;Conectar com Instagram&quot;, recebemos da
                    Meta o identificador numérico da sua conta profissional, o @ e um token de acesso.
                </li>
                <li>
                    <strong>Configurações de marca:</strong> temas, tom de voz, cores, logo e demais preferências que
                    você mesmo preenche para orientar a geração dos posts.
                </li>
                <li>
                    <strong>Conteúdo gerado:</strong> as legendas e imagens produzidas, e o identificador da publicação
                    no Instagram quando o post é publicado.
                </li>
            </ul>
            <p>
                Não coletamos sua senha do Instagram nem do Facebook — a autenticação acontece inteiramente no site da
                Meta. Não lemos mensagens diretas nem dados de seguidores.
            </p>

            <h2>Como usamos</h2>
            <ul>
                <li>Publicar no seu feed do Instagram, nos horários que você agendou ou quando você solicita.</li>
                <li>Gerar legendas e imagens a partir das preferências da sua marca.</li>
                <li>Manter você autenticado no painel.</li>
            </ul>
            <p>Não vendemos, alugamos nem compartilhamos seus dados para fins de publicidade de terceiros.</p>

            <h2>Serviços de terceiros</h2>
            <ul>
                <li>
                    <strong>Meta (Instagram Graph API):</strong> publicação dos posts e leitura dos dados básicos da
                    conta.
                </li>
                <li>
                    <strong>Provedores de IA:</strong> os temas e as preferências de marca são enviados para gerar o
                    texto e a imagem de cada post.
                </li>
                <li>
                    <strong>Infraestrutura de hospedagem e banco de dados</strong>, para executar a aplicação e
                    armazenar os dados descritos acima.
                </li>
            </ul>

            <h2>Retenção e segurança</h2>
            <p>
                Os dados ficam armazenados enquanto sua conta existir. Tokens de acesso são guardados de forma restrita
                e usados apenas para publicar em seu nome; você pode revogá-los a qualquer momento nas configurações do
                Instagram, em &quot;Apps e sites&quot;, o que interrompe imediatamente nosso acesso.
            </p>

            <h2>Seus direitos</h2>
            <p>
                Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento. Veja o procedimento
                em <Link href="/exclusao-de-dados" className="text-primary underline">exclusão de dados</Link> ou
                escreva para <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">{CONTACT_EMAIL}</a>.
            </p>

            <h2>Alterações</h2>
            <p>
                Se esta política mudar, atualizaremos a data no topo desta página. Mudanças relevantes serão comunicadas
                pelo e-mail cadastrado.
            </p>

            <h2>Contato</h2>
            <p>
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">{CONTACT_EMAIL}</a>
            </p>
        </LegalPage>
    );
}
