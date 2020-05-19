import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';

export interface PointCoordinates {
  x: number;
  y: number;
}

@Component({
  selector: 'app-selection-area',
  templateUrl: './selection-area.component.html',
  styleUrls: ['./selection-area.component.scss']
})
export class SelectionAreaComponent implements AfterViewInit {
  // Image URL or base64
  public source: string;
  // Image dimensions
  public width: number;
  public height: number;

  // Points
  public coordinates: PointCoordinates[] = Array(4).map((_, index: number) => {
    return {
      x: 0,
      y: 0
    };
  });
  public initialCoordinates: PointCoordinates[] = Array(4);

  @ViewChild('image', { static: true })
  public imageElement: ElementRef;

  @ViewChild('cuttingArea', { static: true })
  public cuttingAreaElement: ElementRef;

  @ViewChild('cuttedCanvas', { static: true })
  public cuttedCanvas: ElementRef;

  @ViewChild('outputImage', { static: true })
  public outputImageElement: ElementRef;

  @Input()
  set imageURL(url: string) {
    this.source = url;
  }

  @Input()
  set imageBase64(base64: string) {
    this.source = base64;
  }

  public constructor(
    private readonly changeDetectorRef: ChangeDetectorRef
  ) { }

  ngAfterViewInit(): void {
    const rect: ClientRect = this.imageElement.nativeElement.getBoundingClientRect();

    // Set image dimensions
    this.width = rect.width;
    this.height = rect.height;

    // Set initial position of cutting points
    this.setInitPosition();
    // Render cutting area
    this.renderCuttingArea();
    // Render canvas after cutting
    this.renderCuttedCanvas();
    // Render cutted image from canvas

    this.changeDetectorRef.detectChanges();
  }

  private setInitPosition(): void {
    this.initialCoordinates = [
      { x: 0, y: 0 },
      { x: this.width, y: 0 },
      { x: this.width, y: this.height },
      { x: 0, y: this.height }
    ];
  }

  public moveCuttingHandler(index: number, coordinates: PointCoordinates): void {
    this.coordinates[index] = coordinates;
    this.renderCuttingArea();
    this.renderCuttedCanvas();
    this.renderImage();
  }

  public getCoordinates(index: number): PointCoordinates {
    return this.coordinates[index] || this.initialCoordinates[index];
  }

  public renderCuttingArea(): void {
    const canvas: HTMLCanvasElement = this.cuttingAreaElement.nativeElement;

    const pointA: PointCoordinates = this.getCoordinates(0);
    const pointB: PointCoordinates = this.getCoordinates(1);
    const pointC: PointCoordinates = this.getCoordinates(2);
    const pointD: PointCoordinates = this.getCoordinates(3);

    if (canvas.getContext) {
      const ctx = canvas.getContext('2d');

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.beginPath();
      ctx.moveTo(pointA.x, pointA.y);
      ctx.lineTo(pointB.x, pointB.y);
      ctx.lineTo(pointC.x, pointC.y);
      ctx.lineTo(pointD.x, pointD.y);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fill();
    }
  }

  private renderCuttedCanvas(): void {
    const canvas: HTMLCanvasElement = this.cuttedCanvas.nativeElement;

    const pointA: PointCoordinates = this.getCoordinates(0);
    const pointB: PointCoordinates = this.getCoordinates(1);
    const pointC: PointCoordinates = this.getCoordinates(2);
    const pointD: PointCoordinates = this.getCoordinates(3);

    if (canvas.getContext) {
      const ctx = canvas.getContext('2d');

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.beginPath();
      ctx.moveTo(pointA.x, pointA.y);
      ctx.lineTo(pointB.x, pointB.y);
      ctx.lineTo(pointC.x, pointC.y);
      ctx.lineTo(pointD.x, pointD.y);

      ctx.clip();
      ctx.drawImage(this.imageElement.nativeElement, 0, 0, this.width, this.height);
      ctx.restore();
    }
  }

  private renderImage(): void {
    const image: HTMLImageElement = this.outputImageElement.nativeElement;
    image.src = this.cuttedCanvas.nativeElement.toDataURL();

    const pointA = this.getCoordinates(0);
    const pointB = this.getCoordinates(1);
    const pointC = this.getCoordinates(2);
    const pointD = this.getCoordinates(3);

    // Coordinates list
    const horizontalCoordinates: number[] = [pointA.x, pointB.x, pointC.x, pointD.x].sort((a, b) => a - b);
    const verticalCoordinates: number[] = [pointA.y, pointB.y, pointC.y, pointD.y].sort((a, b) => a - b);

    // Offsets
    const offsetX: number = horizontalCoordinates[0];
    const offsetY: number = verticalCoordinates[0];

    // Dimensions
    const width: number = horizontalCoordinates[3] - horizontalCoordinates[0];
    const height: number = verticalCoordinates[3] - verticalCoordinates[0];

    let isLoaded = false;

    image.onload = () => {
      if (!isLoaded) {
        image.src = this.cropImage(image, offsetX, offsetY, width, height);
        isLoaded = true;
      }
    };
  }

  public cropImage(canvas: HTMLCanvasElement | HTMLImageElement, offsetX: number, offsetY: number, width: number, height: number): string {
    const buffer: HTMLCanvasElement = document.createElement('canvas');
    const bufferCtx: CanvasRenderingContext2D = buffer.getContext('2d');

    buffer.width = width;
    buffer.height = height;

    bufferCtx.drawImage(canvas, offsetX, offsetY, width, height, 0, 0, buffer.width, buffer.height);
    return buffer.toDataURL();
  }
}
