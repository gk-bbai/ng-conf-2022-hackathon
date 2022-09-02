import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    Input,
    OnChanges,
    SimpleChanges,
    ViewChild,
} from '@angular/core';
import { IPlayer, IGameState } from '../../../../models';

const DEFAULT_COIN_COLOR = 'yellow';
const DEFAULT_OTHER_PLAYER_COLOR = 'red';
const DEFAULT_PLAYER_COLOR = 'blue';
const DEFAULT_PLAYER_NAME = 'You';
const DEFAULT_PLAYER_SIZE = 5;
// how far apart each grid line is in pixels
const SCALE = 10;
// how often a grid line is rendered
const GRID_SCALE = 5;

@Component({
    selector: 'app-field',
    templateUrl: './field.component.html',
    styleUrls: ['./field.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldComponent implements AfterViewInit, OnChanges {
    @ViewChild('field', { static: true })
    field?: ElementRef;

    @Input()
    state?: IGameState;

    @Input() player!: IPlayer;
    @Input()
    playerColor = DEFAULT_PLAYER_COLOR;
    @Input()
    playerSize = DEFAULT_PLAYER_SIZE;

    canvas?: HTMLCanvasElement;
    ctx!: CanvasRenderingContext2D;

    spriteSheet = new Image();
    spriteData: { x: number; y: number; w: number; h: number }[] = [
        {
            x: 6,
            y: 4,
            w: 56,
            h: 55,
        },
        {
            x: 67,
            y: 3,
            w: 62,
            h: 58,
        },
        {
            x: 132,
            y: 4,
            w: 53,
            h: 55,
        },
        {
            x: 71,
            y: 65,
            w: 51,
            h: 58,
        },
        {
            x: 69,
            y: 125,
            w: 56,
            h: 59,
        },
        {
            x: 14,
            y: 128,
            w: 39,
            h: 57,
        },
        {
            x: 131,
            y: 130,
            w: 55,
            h: 56,
        },
    ];

    constructor() {}

    get width() {
        return this.canvas?.clientWidth ?? 0;
    }
    get height() {
        return this.canvas?.clientHeight ?? 0;
    }

    ngAfterViewInit(): void {
        this.canvas = this.field!.nativeElement;
        this.ctx = this.canvas!.getContext('2d')!;
        this.render();
        window.addEventListener('resize', () => this.render());

        this.spriteSheet.src = 'assets/shipsall.gif';
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.render();
    }

    render() {
        if (!this.canvas || !this.ctx) {
            return;
        }

        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
        this.ctx.fillStyle = '0x1b1b1e';
        this.ctx.fillRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
        this.drawBackground();
        this.drawTokens();
        this.drawOtherPlayers();
        this.drawPlayer();
    }

    getCanvasCoordinatesFromStateCoordinates(stateX: number, stateY: number): { x: number; y: number } | null {
        if (!this.player || !this.canvas) {
            return null;
        }

        const playerCanvasX = this.canvas.clientWidth / 2;
        const playerCanvasY = this.canvas.clientHeight / 2;

        const x = playerCanvasX - (this.player.x - stateX) * SCALE;
        if (x < 0 || x > this.canvas.width) {
            return null;
        }

        const y = playerCanvasY - (this.player.y - stateY) * SCALE;
        if (y < 0 || y > this.canvas.height) {
            return null;
        }

        return { x, y };
    }

    drawPlayer() {
        if (!this.canvas || !this.ctx) {
            return;
        }

        // player is always at the center of the screen
        const x = this.canvas.clientWidth / 2;
        const y = this.canvas.clientHeight / 2;

        this.drawCircle(x, y, this.playerSize, this.playerColor, 'black', this.player?.name ?? DEFAULT_PLAYER_NAME);

        const sprite = this.spriteData[0]
        this.drawSprite(x, y, sprite, this.player.direction)
    }

    drawTokens() {
        if (!this.canvas || !this.ctx || !this.state) {
            return;
        }

        const visibleCoins = this.state.coins
            .map(c => ({
                coin: c,
                canvasCoord: this.getCanvasCoordinatesFromStateCoordinates(c.x, c.y),
            }))
            .filter(c => c.canvasCoord);

        for (let coin of visibleCoins) {
            const x = coin.canvasCoord!.x;
            const y = coin.canvasCoord!.y;

            // this.drawCircle(x, y, this.playerSize, DEFAULT_COIN_COLOR, 'gray');
            this.drawStar(x, y, 5, 4, 2);
        }
    }

    drawOtherPlayers() {
        if (!this.canvas || !this.ctx || !this.state) {
            return;
        }

        const visiblePlayers = this.state.players
            .filter(p => p !== this.player)
            .map(p => ({
                player: p,
                canvasCoord: this.getCanvasCoordinatesFromStateCoordinates(p.x, p.y),
            }))
            .filter(c => c.canvasCoord);

        visiblePlayers.forEach((p, index) => {
            const x = p.canvasCoord!.x;
            const y = p.canvasCoord!.y;

            this.drawCircle(x, y, this.playerSize, DEFAULT_OTHER_PLAYER_COLOR, 'black', p.player.name);
            const sprite = this.spriteData[index + 1 % this.spriteData.length]

            this.drawSprite(x, y, sprite, p.player.direction)
        });
    }

    drawSprite(x: number, y: number, sprite: any, direction: string) {
        let degrees = 0

        switch(direction) {
            case 'up':
                degrees = 0;
                break;
            case 'right':
                degrees = 90;
                break;
            case 'down':
                degrees = 180;
                break;
            case 'left':
                degrees = 270;
                break;
            default:
                degrees = 0;
                break;
        }

        this.ctx.save()

        this.ctx.translate(x, y)
        this.ctx.rotate(degrees * Math.PI / 180)
        this.ctx.drawImage(
            this.spriteSheet,
            sprite.x,
            sprite.y,
            sprite.w,
            sprite.h,
            -sprite.w / 2,
            -sprite.h / 2,
            sprite.w,
            sprite.h,
        );

        this.ctx.restore()
    }

    drawBackground() {
        if (!this.canvas || !this.ctx) {
            return;
        }

        this.ctx.strokeStyle = 'rgba(109, 103, 110, 0.35)';
        const startX = ((this.player?.x ?? 0) % GRID_SCALE) * SCALE;
        for (let x = this.width - startX; x >= 0; x -= SCALE * GRID_SCALE) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        const startY = ((this.player?.y ?? 0) % GRID_SCALE) * SCALE;
        for (let y = this.height - startY; y >= 0; y -= SCALE * GRID_SCALE) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }

    drawCircle(x: number, y: number, size: number, fillColor: string, strokeColor: string, label?: string) {
        if (!this.ctx) {
            return;
        }

        this.ctx.beginPath();
        this.ctx.fillStyle = fillColor;
        this.ctx.strokeStyle = strokeColor;
        this.ctx.arc(x, y, size, 0, Math.PI * 2, false);
        this.ctx.stroke();
        this.ctx.fill();
        if (label) {
            this.ctx.textAlign = 'center';
            const nameHeight = Number(/\d+/.exec(this.ctx.font));
            this.ctx.fillText(label, x, y - nameHeight - 0.2 * this.playerSize);
        }
    }

    drawStar(cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
        var rot = (Math.PI / 2) * 3;
        var x = cx;
        var y = cy;
        var step = Math.PI / spikes;

        this.ctx.beginPath();
        this.ctx.fillStyle = DEFAULT_COIN_COLOR;
        this.ctx.strokeStyle = DEFAULT_COIN_COLOR;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = DEFAULT_COIN_COLOR;
        this.ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            this.ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            this.ctx.lineTo(x, y);
            rot += step;
        }
        this.ctx.lineTo(cx, cy - outerRadius);
        this.ctx.closePath();
        this.ctx.lineWidth = 5;
        this.ctx.strokeStyle = DEFAULT_COIN_COLOR;
        this.ctx.stroke();
        this.ctx.fillStyle = 'yellow';
        this.ctx.fill();
    }
}
